import crypto from 'node:crypto'
import { firstLanguageTagFromAcceptLanguage, getHeaderInsensitive } from '../lib/httpHeaders'
import { normalizeLocale } from '../lib/localeRegistry'
import { readProfileJsonV2 } from '../lib/profileBlobStore'
import { getSigningSecret, readAccessToken, verifySessionToken } from '../lib/sessionAuth'
import { validateShareLink } from '../lib/shareLinksTable'

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

const SESSION_EXP_HEADER = 'x-cv-session-exp'

function readServerConfiguredProfileSlug() {
  return (process.env.CV_PROFILE_SLUG ?? '').trim()
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
  const tokenRead = readAccessToken(req.headers)
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

  // Verify share link is still valid (not revoked or expired)
  if (tokenVerification.shareId) {
    const shareLinkValidation = await validateShareLink(tokenVerification.shareId)
    if (!shareLinkValidation.ok) {
      context.log('Unauthorized /api/cv request: share link invalid', {
        reason: shareLinkValidation.reason,
        shareId: tokenVerification.shareId,
      })
      const body: { error: string; debug?: Record<string, unknown> } = { error: 'Unauthorized' }
      if (isDebugAuthEnabled()) {
        body.debug = {
          reason: shareLinkValidation.reason,
          shareId: tokenVerification.shareId,
        }
      }
      const response = jsonResponse(401, body)
      attachDebugHeaders(response, signingSecret, {
        'x-cv-debug-reason': `share_link_${shareLinkValidation.reason}`,
        'x-cv-debug-token-source': tokenRead.source,
      })
      context.res = response
      return
    }
  }

  let raw = ''
  let resolvedLocale = requestedLocale
  try {
    const slug = readServerConfiguredProfileSlug()
    if (!slug) {
      context.res = jsonResponse(500, { error: 'CV data is not configured.' })
      return
    }
    raw = await readProfileJsonV2({ kind: 'private', locale: requestedLocale, slugFromName: slug, legacyFallback: false })
    resolvedLocale = requestedLocale
    context.log('Loaded PRIVATE_PROFILE payload', {
      payloadSource: 'blob_v2',
      localeRequested: requestedLocale,
      localeResolved: requestedLocale,
      fromCache: false,
    })
  } catch (error) {
    context.log('Failed loading PRIVATE_PROFILE payload', { failureReason: 'unexpected_loader_error' }, error)
    context.res = jsonResponse(502, { error: 'CV data could not be loaded.' })
    return
  }

  try {
    if (!raw.trim()) {
      const response = jsonResponse(200, { locale: resolvedLocale })
      response.headers = {
        ...(response.headers ?? {}),
        [SESSION_EXP_HEADER]: String(tokenVerification.exp),
      }
      attachDebugHeaders(response, signingSecret, { 'x-cv-debug-token-source': tokenRead.source })
      context.res = response
      return
    }
    const data = JSON.parse(raw) as Record<string, unknown>

    if (data && typeof data === 'object') {
      const dataObj = data as Record<string, unknown>
      if (!dataObj.locale) dataObj.locale = resolvedLocale
      // Rewrite legacy admin-only photo URL to the token-authenticated
      // endpoint so token holders (who are not Azure AD admins) can load it.
      const basics = dataObj.basics as Record<string, unknown> | undefined
      if (basics && (basics.photoUrl === '/api/manage/profile/image' || basics.photoUrl === '/api/public-profile/image')) {
        basics.photoUrl = '/api/private-profile/image'
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

