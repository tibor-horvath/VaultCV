import { readSupportedLocalesCached, readSupportedLocalesForProfileCached } from '../lib/localeRegistry'

type Context = {
  res?: {
    status: number
    headers?: Record<string, string>
    body?: unknown
  }
}

type HttpRequest = {
  query?: Record<string, string | undefined>
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
  const slug = (process.env.CV_PROFILE_SLUG ?? '').trim()
  if (!slug) {
    context.res = jsonResponse(500, { error: 'CV_PROFILE_SLUG is not configured.' })
    return
  }

  const requestedScope = (req.query?.scope ?? '').trim().toLowerCase()
  const scope = requestedScope === 'public' || requestedScope === 'private' ? requestedScope : ''
  const locales = scope ? await readSupportedLocalesForProfileCached(slug, scope) : await readSupportedLocalesCached(slug)
  context.res = jsonResponse(200, { locales })
}

