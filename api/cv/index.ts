import crypto from 'node:crypto'

type Context = {
  log: (...args: unknown[]) => void
  res?: {
    status: number
    headers?: Record<string, string>
    body?: unknown
  }
}

type HttpRequest = {
  query?: Record<string, string | undefined>
}

function constantTimeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
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

export default async function (context: Context, req: HttpRequest) {
  const token = req.query?.t ?? ''
  const expected = process.env.CV_ACCESS_TOKEN ?? ''

  if (!expected) {
    context.res = jsonResponse(500, { error: 'Server is not configured.' })
    return
  }

  // Enforce GUID tokens to keep access links short and predictable.
  if (!token || !isGuidN(token)) {
    context.res = jsonResponse(400, { error: 'Invalid token format.' })
    return
  }

  if (!isGuidN(expected)) {
    context.res = jsonResponse(500, { error: 'Server token is invalid.' })
    return
  }

  if (!token || !constantTimeEqual(token, expected)) {
    context.res = jsonResponse(401, { error: 'Unauthorized' })
    return
  }

  const raw = process.env.CV_JSON ?? ''
  if (!raw) {
    context.res = jsonResponse(500, { error: 'CV data is not configured.' })
    return
  }

  try {
    const data = JSON.parse(raw) as unknown
    context.res = jsonResponse(200, data)
  } catch (err) {
    context.log('Failed parsing CV_JSON', err)
    context.res = jsonResponse(500, { error: 'CV data is invalid JSON.' })
  }
}

