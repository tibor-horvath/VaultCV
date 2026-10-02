import { readBrandingCached } from '../lib/branding'

type Context = {
  res?: {
    status: number
    headers?: Record<string, string>
    body?: unknown
  }
}

function jsonResponse(status: number, body: unknown, cacheControl = 'no-store') {
  return {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cacheControl,
    },
    body,
  }
}

/** Public: the favicon and footer brandmark every page shows. Safe to cache briefly. */
export default async function (context: Context) {
  try {
    const slug = (process.env.CV_PROFILE_SLUG ?? '').trim()
    if (!slug) {
      context.res = jsonResponse(500, { error: 'CV_PROFILE_SLUG is not configured.' })
      return
    }

    const branding = await readBrandingCached(slug)
    context.res = jsonResponse(200, branding, 'public, max-age=60')
  } catch (e: unknown) {
    context.res = jsonResponse(500, { error: e instanceof Error && e.message ? e.message : 'Internal server error.' })
  }
}
