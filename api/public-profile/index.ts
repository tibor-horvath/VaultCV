import { firstLanguageTagFromAcceptLanguage, getHeaderInsensitive } from '../lib/httpHeaders'
import { normalizeLocale } from '../lib/localeRegistry'
import { readProfileJsonV2 } from '../lib/profileBlobStore'

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

function readServerConfiguredProfileSlug() {
  return (process.env.CV_PROFILE_SLUG ?? '').trim()
}

export default async function (context: Context, req: HttpRequest) {
  const acceptLanguage = getHeaderInsensitive(req.headers, 'accept-language')
  const requestedLocale = normalizeLocale(firstLanguageTagFromAcceptLanguage(acceptLanguage))
  let raw = ''
  let resolvedLocale = requestedLocale
  const slug = readServerConfiguredProfileSlug()

  try {
    if (!slug) {
      context.res = jsonResponse(404, { error: 'CV_PROFILE_SLUG is not configured.' })
      return
    }
    raw = await readProfileJsonV2({ kind: 'public', locale: requestedLocale, slugFromName: slug, legacyFallback: false })
    resolvedLocale = requestedLocale
    context.log('Loaded PUBLIC_PROFILE payload', {
      payloadSource: 'blob_v2',
      localeRequested: requestedLocale,
      localeResolved: requestedLocale,
      fromCache: false,
    })
  } catch (error) {
    context.log('Failed loading PUBLIC_PROFILE payload', { failureReason: 'unexpected_loader_error' }, error)
    context.res = jsonResponse(502, { error: 'PUBLIC_PROFILE could not be loaded.' })
    return
  }

  try {
    if (!raw.trim()) {
      context.res = jsonResponse(200, { locale: resolvedLocale })
      return
    }
    const data = JSON.parse(raw) as Record<string, unknown>
    if (!data.locale) data.locale = resolvedLocale
    context.res = jsonResponse(200, data)
  } catch (err) {
    context.log('Failed parsing PUBLIC_PROFILE payload JSON', err)
    context.res = jsonResponse(500, { error: 'PUBLIC_PROFILE is invalid JSON payload.' })
  }
}

