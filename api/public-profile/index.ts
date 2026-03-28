import { firstLanguageTagFromAcceptLanguage, getHeaderInsensitive } from '../lib/httpHeaders'
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
  const { raw, resolvedLocale } = readLocalizedEnvJson('PUBLIC_PROFILE_JSON', requestedLocale)

  if (!raw) {
    // Keep API and web fallback data separate to avoid drift.
    // The web app can still use `/public-profile.json` if this env var is unset.
    context.res = jsonResponse(404, { error: 'PUBLIC_PROFILE_JSON is not configured.' })
    return
  }

  try {
    const data = JSON.parse(raw) as Record<string, unknown>
    if (!data.locale) data.locale = resolvedLocale
    context.res = jsonResponse(200, data)
  } catch (err) {
    context.log('Failed parsing PUBLIC_PROFILE_JSON', err)
    context.res = jsonResponse(500, { error: 'PUBLIC_PROFILE_JSON is invalid JSON.' })
  }
}

