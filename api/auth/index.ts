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

function getSigningSecretFingerprint(secret: string) {
  if (!secret) return 'missing'
  return crypto.createHash('sha256').update(secret).digest('hex').slice(0, 12)
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
  const signingSecretFingerprint = getSigningSecretFingerprint(signingSecret)

  if (!expected || !signingSecret) {
    // #region agent log
    fetch('http://127.0.0.1:7741/ingest/111ce85a-0d60-4ead-aca6-5123da71a13d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ac91fc'},body:JSON.stringify({sessionId:'ac91fc',runId:'run1',hypothesisId:'H1',location:'api/auth/index.ts:74',message:'auth missing required config',data:{hasExpected:Boolean(expected),hasSigningSecret:Boolean(signingSecret),signingSecretFingerprint,timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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

  // #region agent log
  fetch('http://127.0.0.1:7741/ingest/111ce85a-0d60-4ead-aca6-5123da71a13d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ac91fc'},body:JSON.stringify({sessionId:'ac91fc',runId:'run1',hypothesisId:'H2',location:'api/auth/index.ts:97',message:'auth issued session token',data:{signingSecretFingerprint,ttlSeconds:getSessionTtlSeconds()},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  context.res = jsonResponse(200, { accessToken: issueSessionToken(getSessionTtlSeconds()) })
}
