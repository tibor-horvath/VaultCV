import { readProfileImage } from '../lib/profileBlobStore'

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

export default async function (context: Context, _req: HttpRequest) {
  try {
    const slug = readServerConfiguredProfileSlug()
    if (!slug) {
      context.res = jsonResponse(500, { error: 'Server not configured.' })
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
