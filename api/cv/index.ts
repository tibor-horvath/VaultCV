import crypto from 'node:crypto'
import { normalizeLocale, readLocalizedEnvJson } from '../lib/localeRegistry'

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
  headers?: Record<string, string | undefined>
}

function constantTimeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

function getSigningSecret() {
  return (process.env.CV_SESSION_SIGNING_KEY ?? '').trim()
}

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url')
}

function verifySessionToken(token: string) {
  const [encodedPayload, providedSig] = token.split('.')
  if (!encodedPayload || !providedSig) return false

  const signingSecret = getSigningSecret()
  if (!signingSecret) return false

  const expectedSig = toBase64Url(crypto.createHmac('sha256', signingSecret).update(encodedPayload).digest())
  if (!constantTimeEqual(providedSig, expectedSig)) return false

  try {
    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf8')
    const payload = JSON.parse(payloadJson) as { exp?: number }
    const exp = payload.exp ?? 0
    if (!Number.isFinite(exp)) return false
    return Math.floor(Date.now() / 1000) < exp
  } catch {
    return false
  }
}

function getHeaderInsensitive(headers: Record<string, string | undefined> | undefined, name: string) {
  if (!headers) return undefined
  const lower = name.toLowerCase()
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower && typeof v === 'string') return v
  }
  return undefined
}

function readBearerToken(authHeader: string | undefined) {
  if (!authHeader) return ''
  const normalized = authHeader.trim()
  const match = /^Bearer\s+(.+)$/i.exec(normalized)
  return match?.[1]?.trim() ?? ''
}

function readAccessToken(req: HttpRequest) {
  const bearer = readBearerToken(getHeaderInsensitive(req.headers, 'authorization'))
  if (bearer) return bearer
  return getHeaderInsensitive(req.headers, 'x-cv-session-token')?.trim() ?? ''
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

function normalizeSasToken(token: string) {
  return token.trim().replace(/^\?+/, '')
}

function appendSasToken(url: string, sasToken: string) {
  if (!sasToken) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${sasToken}`
}

export default async function (context: Context, req: HttpRequest) {
  const accessToken = readAccessToken(req)
  const requestedLocale = normalizeLocale(req.query?.lang)
  if (!getSigningSecret()) {
    context.res = jsonResponse(500, { error: 'Server is not configured.' })
    return
  }
  if (!accessToken || !verifySessionToken(accessToken)) {
    context.res = jsonResponse(401, { error: 'Unauthorized' })
    return
  }

  const { raw, resolvedLocale } = readLocalizedEnvJson('PRIVATE_PROFILE_JSON', requestedLocale)
  if (!raw) {
    context.res = jsonResponse(500, { error: 'CV data is not configured.' })
    return
  }

  try {
    const data = JSON.parse(raw) as Record<string, unknown>

    // Allow moving photo URL out of `PRIVATE_PROFILE_JSON`.
    // Inject a direct URL from `PROFILE_PHOTO_URL` (+ optional `PROFILE_PHOTO_SAS_TOKEN`).
    if (data && typeof data === 'object') {
      const dataObj = data as Record<string, unknown>
      if (!dataObj.locale) dataObj.locale = resolvedLocale
      const basics =
        dataObj.basics && typeof dataObj.basics === 'object' ? (dataObj.basics as Record<string, unknown>) : (dataObj.basics = {})

      const photoUrl = process.env.PROFILE_PHOTO_URL?.trim() ?? ''
      const photoSasToken = normalizeSasToken(process.env.PROFILE_PHOTO_SAS_TOKEN ?? '')
      if (photoUrl) {
        basics.photoUrl = appendSasToken(photoUrl, photoSasToken)
      }
    }

    context.res = jsonResponse(200, data)
  } catch (err) {
    context.log('Failed parsing PRIVATE_PROFILE_JSON', err)
    context.res = jsonResponse(500, { error: 'CV data is invalid JSON.' })
  }
}

