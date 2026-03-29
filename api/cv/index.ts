import crypto from 'node:crypto'
import { firstLanguageTagFromAcceptLanguage, getHeaderInsensitive } from '../lib/httpHeaders'
import { normalizeLocale } from '../lib/localeRegistry'
import { ProfilePayloadSourceError, readLocalizedProfilePayload } from '../lib/profilePayloadSource'

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

type TokenVerificationResult =
  | { ok: true; exp: number }
  | { ok: false; reason: 'missing_token' | 'invalid_format' | 'missing_signing_secret' | 'signature_mismatch' | 'invalid_payload' | 'expired' }

type AccessTokenReadResult = {
  token: string
  source: 'authorization' | 'x-cv-session-token' | 'cookie' | 'none'
  hasAuthorizationHeader: boolean
  authorizationHeaderHasBearer: boolean
  hasSessionHeader: boolean
  hasCookieHeader: boolean
}

const SESSION_COOKIE_NAME = 'cv_session'
const SESSION_EXP_HEADER = 'x-cv-session-exp'

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

function verifySessionToken(token: string): TokenVerificationResult {
  if (!token) return { ok: false, reason: 'missing_token' }
  const [encodedPayload, providedSig] = token.split('.')
  if (!encodedPayload || !providedSig) return { ok: false, reason: 'invalid_format' }

  const signingSecret = getSigningSecret()
  if (!signingSecret) return { ok: false, reason: 'missing_signing_secret' }

  const expectedSig = toBase64Url(crypto.createHmac('sha256', signingSecret).update(encodedPayload).digest())
  if (!constantTimeEqual(providedSig, expectedSig)) return { ok: false, reason: 'signature_mismatch' }

  try {
    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf8')
    const payload = JSON.parse(payloadJson) as { exp?: number }
    const exp = payload.exp ?? 0
    if (!Number.isFinite(exp)) return { ok: false, reason: 'invalid_payload' }
    if (Math.floor(Date.now() / 1000) >= exp) return { ok: false, reason: 'expired' }
    return { ok: true, exp }
  } catch {
    return { ok: false, reason: 'invalid_payload' }
  }
}

function readBearerToken(authHeader: string | undefined) {
  if (!authHeader) return ''
  const normalized = authHeader.trim()
  const match = /^Bearer\s+(.+)$/i.exec(normalized)
  return match?.[1]?.trim() ?? ''
}

function readCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return ''
  const cookieParts = cookieHeader.split(';')
  for (const part of cookieParts) {
    const [rawName, ...rawValueParts] = part.split('=')
    const cookieName = rawName?.trim()
    if (cookieName !== name) continue
    const rawValue = rawValueParts.join('=').trim()
    if (!rawValue) return ''
    try {
      return decodeURIComponent(rawValue)
    } catch {
      return rawValue
    }
  }
  return ''
}

function readAccessToken(req: HttpRequest): AccessTokenReadResult {
  const authorizationHeader = getHeaderInsensitive(req.headers, 'authorization')
  const sessionHeader = getHeaderInsensitive(req.headers, 'x-cv-session-token')
  const cookieHeader = getHeaderInsensitive(req.headers, 'cookie')
  const sessionToken = sessionHeader?.trim() ?? ''
  if (sessionToken) {
    return {
      token: sessionToken,
      source: 'x-cv-session-token',
      hasAuthorizationHeader: Boolean(authorizationHeader?.trim()),
      authorizationHeaderHasBearer: Boolean(readBearerToken(authorizationHeader)),
      hasSessionHeader: true,
      hasCookieHeader: Boolean(cookieHeader?.trim()),
    }
  }
  const cookieToken = readCookieValue(cookieHeader, SESSION_COOKIE_NAME).trim()
  if (cookieToken) {
    return {
      token: cookieToken,
      source: 'cookie',
      hasAuthorizationHeader: Boolean(authorizationHeader?.trim()),
      authorizationHeaderHasBearer: Boolean(readBearerToken(authorizationHeader)),
      hasSessionHeader: Boolean(sessionHeader?.trim()),
      hasCookieHeader: true,
    }
  }
  const bearer = readBearerToken(authorizationHeader)
  if (bearer) {
    return {
      token: bearer,
      source: 'authorization',
      hasAuthorizationHeader: Boolean(authorizationHeader?.trim()),
      authorizationHeaderHasBearer: true,
      hasSessionHeader: Boolean(sessionHeader?.trim()),
      hasCookieHeader: Boolean(cookieHeader?.trim()),
    }
  }
  return {
    token: '',
    source: 'none',
    hasAuthorizationHeader: Boolean(authorizationHeader?.trim()),
    authorizationHeaderHasBearer: false,
    hasSessionHeader: Boolean(sessionHeader?.trim()),
    hasCookieHeader: Boolean(cookieHeader?.trim()),
  }
}

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

function normalizeSasToken(token: string) {
  return token.trim().replace(/^\?+/, '')
}

function appendSasToken(url: string, sasToken: string) {
  if (!sasToken) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${sasToken}`
}

function isDebugAuthEnabled() {
  if ((process.env.NODE_ENV ?? '').trim().toLowerCase() === 'production') return false
  return (process.env.CV_DEBUG_AUTH ?? '').trim() === '1'
}

function signingKeyFingerprint(signingSecret: string) {
  if (!signingSecret) return 'missing'
  return crypto.createHash('sha256').update(signingSecret).digest('hex').slice(0, 12)
}

function attachDebugHeaders(
  response: { headers?: Record<string, string> },
  signingSecret: string,
  fields: Partial<Record<'x-cv-debug-reason' | 'x-cv-debug-token-source', string>>,
) {
  if (!isDebugAuthEnabled()) return
  response.headers = {
    ...(response.headers ?? {}),
    'x-cv-debug-signing-key-fp': signingKeyFingerprint(signingSecret),
    ...fields,
  }
}

export default async function (context: Context, req: HttpRequest) {
  const tokenRead = readAccessToken(req)
  const accessToken = tokenRead.token
  const acceptLanguage = getHeaderInsensitive(req.headers, 'accept-language')
  const requestedLocale = normalizeLocale(firstLanguageTagFromAcceptLanguage(acceptLanguage))
  const signingSecret = getSigningSecret()
  if (!signingSecret) {
    const response = jsonResponse(500, { error: 'Server is not configured.' })
    attachDebugHeaders(response, signingSecret, { 'x-cv-debug-reason': 'missing_signing_secret' })
    context.res = response
    return
  }
  const tokenVerification = verifySessionToken(accessToken)
  if (!tokenVerification.ok) {
    context.log('Unauthorized /api/cv request', {
      reason: tokenVerification.reason,
      tokenSource: tokenRead.source,
      hasAuthorizationHeader: tokenRead.hasAuthorizationHeader,
      authorizationHeaderHasBearer: tokenRead.authorizationHeaderHasBearer,
      hasSessionHeader: tokenRead.hasSessionHeader,
      hasCookieHeader: tokenRead.hasCookieHeader,
    })
    const body: { error: string; debug?: Record<string, unknown> } = { error: 'Unauthorized' }
    if (isDebugAuthEnabled()) {
      body.debug = {
        reason: tokenVerification.reason,
        tokenSource: tokenRead.source,
        hasAuthorizationHeader: tokenRead.hasAuthorizationHeader,
        authorizationHeaderHasBearer: tokenRead.authorizationHeaderHasBearer,
        hasSessionHeader: tokenRead.hasSessionHeader,
        hasCookieHeader: tokenRead.hasCookieHeader,
        selectedTokenLength: accessToken.length,
      }
    }
    const response = jsonResponse(401, body)
    attachDebugHeaders(response, signingSecret, {
      'x-cv-debug-reason': tokenVerification.reason,
      'x-cv-debug-token-source': tokenRead.source,
    })
    context.res = response
    return
  }

  let raw = ''
  let resolvedLocale = requestedLocale
  try {
    const payload = await readLocalizedProfilePayload('PRIVATE_PROFILE_JSON_URL', requestedLocale)
    raw = payload.raw
    resolvedLocale = payload.resolvedLocale
    context.log('Loaded PRIVATE_PROFILE payload', {
      payloadSource: payload.source,
      localeRequested: requestedLocale,
      localeResolved: payload.resolvedLocale,
      fromCache: payload.fromCache,
    })
  } catch (error) {
    if (error instanceof ProfilePayloadSourceError) {
      context.log('Failed loading PRIVATE_PROFILE payload', {
        payloadSource: 'profile_payload_loader',
        failureReason: error.reason,
        payloadKey: error.key,
        urlHost: error.urlHost,
        httpStatus: error.httpStatus,
      })
      context.res = jsonResponse(error.reason === 'not_configured' ? 500 : 502, {
        error: error.reason === 'not_configured' ? 'CV data is not configured.' : 'CV data could not be loaded.',
      })
      return
    }
    context.log('Failed loading PRIVATE_PROFILE payload', { failureReason: 'unexpected_loader_error' }, error)
    context.res = jsonResponse(502, { error: 'CV data could not be loaded.' })
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

    const response = jsonResponse(200, data)
    response.headers = {
      ...(response.headers ?? {}),
      [SESSION_EXP_HEADER]: String(tokenVerification.exp),
    }
    attachDebugHeaders(response, signingSecret, { 'x-cv-debug-token-source': tokenRead.source })
    context.res = response
  } catch (err) {
    context.log('Failed parsing PRIVATE_PROFILE payload JSON', err)
    const response = jsonResponse(500, { error: 'CV data is invalid JSON.' })
    attachDebugHeaders(response, signingSecret, { 'x-cv-debug-reason': 'invalid_cv_json' })
    context.res = response
  }
}

