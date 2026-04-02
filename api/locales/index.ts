import { readSupportedLocalesCached } from '../lib/localeRegistry'

type Context = {
  res?: {
    status: number
    headers?: Record<string, string>
    body?: unknown
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
  }
}

export default async function (context: Context) {
  const slug = (process.env.CV_PROFILE_SLUG ?? '').trim()
  if (!slug) {
    context.res = jsonResponse(500, { error: 'CV_PROFILE_SLUG is not configured.' })
    return
  }

  const locales = await readSupportedLocalesCached(slug)
  context.res = jsonResponse(200, { locales })
}

