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

export default async function (context: Context, req: HttpRequest) {
  const acceptLanguage = getHeaderInsensitive(req.headers, 'accept-language')
  const requestedLocale = normalizeLocale(firstLanguageTagFromAcceptLanguage(acceptLanguage))
  let raw = ''
  let resolvedLocale = requestedLocale
  try {
    const payload = await readLocalizedProfilePayload('PUBLIC_PROFILE_JSON_URL', requestedLocale)
    raw = payload.raw
    resolvedLocale = payload.resolvedLocale
    context.log('Loaded PUBLIC_PROFILE payload', {
      payloadSource: payload.source,
      localeRequested: requestedLocale,
      localeResolved: payload.resolvedLocale,
      fromCache: payload.fromCache,
    })
  } catch (error) {
    if (error instanceof ProfilePayloadSourceError) {
      context.log('Failed loading PUBLIC_PROFILE payload', {
        payloadSource: 'profile_payload_loader',
        failureReason: error.reason,
        payloadKey: error.key,
        urlHost: error.urlHost,
        httpStatus: error.httpStatus,
      })
      context.res = jsonResponse(error.reason === 'not_configured' ? 404 : 502, {
        error:
          error.reason === 'not_configured' ? 'PUBLIC_PROFILE_JSON_URL is not configured.' : 'PUBLIC_PROFILE_JSON_URL could not be loaded.',
      })
      return
    }
    context.log('Failed loading PUBLIC_PROFILE payload', { failureReason: 'unexpected_loader_error' }, error)
    context.res = jsonResponse(502, { error: 'PUBLIC_PROFILE_JSON_URL could not be loaded.' })
    return
  }

  try {
    const data = JSON.parse(raw) as Record<string, unknown>
    if (!data.locale) data.locale = resolvedLocale
    context.res = jsonResponse(200, data)
  } catch (err) {
    context.log('Failed parsing PUBLIC_PROFILE payload JSON', err)
    context.res = jsonResponse(500, { error: 'PUBLIC_PROFILE_JSON_URL is invalid JSON payload.' })
  }
}

