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

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body,
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

export default async function (context: Context, req: HttpRequest) {
  const payload = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : null
  const code = (typeof payload?.code === 'string' ? payload.code : '').trim()
  const expected = (process.env.CV_ACCESS_TOKEN ?? '').trim()
  const signingSecret = getSigningSecret()

  if (!expected || !signingSecret) {
    context.res = jsonResponse(500, { error: 'Server is not configured.' })
    return
  }

  if (!isGuidN(code)) {
    context.res = jsonResponse(400, { error: 'Invalid token format.' })
    return
  }

  if (!isGuidN(expected)) {
    context.res = jsonResponse(500, { error: 'Server token is invalid.' })
    return
  }

  if (!constantTimeEqual(code, expected)) {
    context.res = jsonResponse(401, { error: 'Unauthorized' })
    return
  }

  context.res = jsonResponse(200, { accessToken: issueSessionToken(getSessionTtlSeconds()) })
}
