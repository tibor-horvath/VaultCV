import crypto from 'node:crypto'
import { getHeaderInsensitive } from './httpHeaders'

export type TokenVerificationResult =
  | { ok: true; exp: number; shareId?: string }
  | { ok: false; reason: 'missing_token' | 'invalid_format' | 'missing_signing_secret' | 'signature_mismatch' | 'invalid_payload' | 'expired' }

export type AccessTokenReadResult = {
  token: string
  source: 'authorization' | 'x-cv-session-token' | 'cookie' | 'none'
  hasAuthorizationHeader: boolean
  authorizationHeaderHasBearer: boolean
  hasSessionHeader: boolean
  hasCookieHeader: boolean
}

export const SESSION_COOKIE_NAME = 'cv_session'

function constantTimeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

export function getSigningSecret() {
  return (process.env.CV_SESSION_SIGNING_KEY ?? '').trim()
}

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url')
}

export function verifySessionToken(token: string): TokenVerificationResult {
  if (!token) return { ok: false, reason: 'missing_token' }
  const parts = token.split('.')
  if (parts.length !== 2) return { ok: false, reason: 'invalid_format' }
  const [encodedPayload, providedSig] = parts
  if (!encodedPayload || !providedSig) return { ok: false, reason: 'invalid_format' }

  const signingSecret = getSigningSecret()
  if (!signingSecret) return { ok: false, reason: 'missing_signing_secret' }

  const expectedSig = toBase64Url(crypto.createHmac('sha256', signingSecret).update(encodedPayload).digest())
  if (!constantTimeEqual(providedSig, expectedSig)) return { ok: false, reason: 'signature_mismatch' }

  try {
    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf8')
    const payload = JSON.parse(payloadJson) as { exp?: number; shareId?: string }
    const exp = payload.exp ?? 0
    if (!Number.isFinite(exp)) return { ok: false, reason: 'invalid_payload' }
    if (Math.floor(Date.now() / 1000) >= exp) return { ok: false, reason: 'expired' }
    return { ok: true, exp, shareId: payload.shareId }
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

export function readAccessToken(headers: Record<string, string | undefined> | undefined): AccessTokenReadResult {
  const authorizationHeader = getHeaderInsensitive(headers, 'authorization')
  const sessionHeader = getHeaderInsensitive(headers, 'x-cv-session-token')
  const cookieHeader = getHeaderInsensitive(headers, 'cookie')
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
