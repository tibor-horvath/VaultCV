import crypto from 'node:crypto'

type Context = {
  res?: {
    status: number
    headers?: Record<string, string>
    body?: unknown
  }
}

type HttpRequest = {
  body?: unknown
}

const SESSION_COOKIE_NAME = 'cv_session'

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body,
  } as {
    status: number
    headers: Record<string, string>
    body: unknown
  }
}

function isGuidN(token: string) {
  return /^[0-9a-f]{32}$/i.test(token)
}

function constantTimeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url')
}

function isDebugAuthEnabled() {
  if ((process.env.NODE_ENV ?? '').trim().toLowerCase() === 'production') return false
  return (process.env.CV_DEBUG_AUTH ?? '').trim() === '1'
}

function signingKeyFingerprint(signingSecret: string) {
  if (!signingSecret) return 'missing'
  return crypto.createHash('sha256').update(signingSecret).digest('hex').slice(0, 12)
}

function attachDebugHeaders(response: { headers?: Record<string, string> }, signingSecret: string) {
  if (!isDebugAuthEnabled()) return
  response.headers = {
    ...(response.headers ?? {}),
    'x-cv-debug-signing-key-fp': signingKeyFingerprint(signingSecret),
  }
}

function getSigningSecret() {
  return (process.env.CV_SESSION_SIGNING_KEY ?? '').trim()
}

function getSessionTtlSeconds() {
  const raw = (process.env.CV_SESSION_TTL_SECONDS ?? '').trim()
  if (!raw) return 60 * 60
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 60 || parsed > 24 * 60 * 60) {
    return 60 * 60
  }
  return parsed
}

function issueSessionToken(expSecondsFromNow: number) {
  const signingSecret = getSigningSecret()
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow
  const encodedPayload = toBase64Url(JSON.stringify({ exp }))
  const signature = toBase64Url(crypto.createHmac('sha256', signingSecret).update(encodedPayload).digest())
  return `${encodedPayload}.${signature}`
}

function buildSessionCookie(token: string, maxAgeSeconds: number) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`
}

export default async function (context: Context, req: HttpRequest) {
  const payload = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : null
  const code = (typeof payload?.code === 'string' ? payload.code : '').trim()
  const expected = (process.env.CV_ACCESS_TOKEN ?? '').trim()
  const signingSecret = getSigningSecret()

  if (!expected || !signingSecret) {
    const response = jsonResponse(500, { error: 'Server is not configured.' })
    attachDebugHeaders(response, signingSecret)
    context.res = response
    return
  }

  if (!isGuidN(code)) {
    const response = jsonResponse(400, { error: 'Invalid token format.' })
    attachDebugHeaders(response, signingSecret)
    context.res = response
    return
  }

  if (!isGuidN(expected)) {
    const response = jsonResponse(500, { error: 'Server token is invalid.' })
    attachDebugHeaders(response, signingSecret)
    context.res = response
    return
  }

  if (!constantTimeEqual(code, expected)) {
    const response = jsonResponse(401, { error: 'Unauthorized' })
    attachDebugHeaders(response, signingSecret)
    context.res = response
    return
  }

  const ttlSeconds = getSessionTtlSeconds()
  const sessionToken = issueSessionToken(ttlSeconds)
  const response = jsonResponse(200, { accessToken: sessionToken })
  response.headers = {
    ...(response.headers ?? {}),
    'set-cookie': buildSessionCookie(sessionToken, ttlSeconds),
  }
  attachDebugHeaders(response, signingSecret)
  context.res = response
}
