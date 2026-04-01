import { readProfileImage, readProfileJsonV2 } from '../lib/profileBlobStore'
import { firstLanguageTagFromAcceptLanguage, getHeaderInsensitive } from '../lib/httpHeaders'
import { normalizeLocale } from '../lib/localeRegistry'

type Context = {
  res?: {
    status: number
    headers?: Record<string, string>
    body?: unknown
  }
}

type HttpRequest = {
  method?: string
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
  } as {
    status: number
    headers: Record<string, string>
    body: unknown
  }
}

function readServerConfiguredProfileSlug() {
  return (process.env.CV_PROFILE_SLUG ?? '').trim()
}

async function isPhotoPublic(slug: string, locale: string): Promise<boolean> {
  const raw = await readProfileJsonV2({ kind: 'public', locale, slugFromName: slug })
  if (!raw.trim()) return false
  const data = JSON.parse(raw) as Record<string, unknown>
  const basics = data?.basics as { photoUrl?: unknown } | undefined
  const photoUrl = basics?.photoUrl
  return typeof photoUrl === 'string' && photoUrl.startsWith('/api/public-profile/image')
}

export default async function (context: Context, req: HttpRequest) {
  try {
    const slug = readServerConfiguredProfileSlug()
    if (!slug) {
      context.res = jsonResponse(500, { error: 'Server not configured.' })
      return
    }

    const acceptLanguage = getHeaderInsensitive(req.headers, 'accept-language')
    const locale = normalizeLocale(firstLanguageTagFromAcceptLanguage(acceptLanguage))

    if (!(await isPhotoPublic(slug, locale))) {
      context.res = jsonResponse(404, { error: 'No profile image found.' })
      return
    }

    const image = await readProfileImage(slug)
    if (!image) {
      context.res = jsonResponse(404, { error: 'No profile image found.' })
      return
    }

    context.res = {
      status: 200,
      headers: {
        'content-type': image.contentType,
        'cache-control': 'no-store',
        'content-length': String(image.buffer.byteLength),
      },
      body: image.buffer,
    }
  } catch (e: any) {
    context.res = jsonResponse(500, { error: e?.message ? String(e.message) : 'Internal server error.' })
  }
}
