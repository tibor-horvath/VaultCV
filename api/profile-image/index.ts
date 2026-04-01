import { deleteProfileImage, readProfileImage, writeProfileImage } from '../lib/profileBlobStore'
import { readAllowedOriginsFromEnv, requireAdminMutationHeader, requireSameOriginMutation } from '../lib/adminRequestGuards'
import { requireAdmin } from '../lib/swaAuth'
import { getHeaderInsensitive } from '../lib/httpHeaders'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png']

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
  query?: Record<string, string | undefined>
  body?: unknown
  rawBody?: unknown
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

function extractBodyBuffer(req: HttpRequest): Buffer | null {
  if (Buffer.isBuffer(req.body)) return req.body
  if (req.body instanceof Uint8Array) return Buffer.from(req.body)
  if (ArrayBuffer.isView(req.body)) return Buffer.from(req.body.buffer as ArrayBuffer, req.body.byteOffset, req.body.byteLength)
  if (req.body instanceof ArrayBuffer) return Buffer.from(req.body)
  return null
}

export default async function (context: Context, req: HttpRequest) {
  try {
    const auth = requireAdmin(req.headers)
    if (!auth.ok) {
      context.res = jsonResponse(401, { error: 'Unauthorized' })
      return
    }

    const slug = readServerConfiguredProfileSlug()
    if (!slug) {
      context.res = jsonResponse(500, { error: 'CV_PROFILE_SLUG is not configured.' })
      return
    }

    const method = (req.method ?? '').toUpperCase()

    if (method === 'GET') {
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
      return
    }

    if (method === 'PUT') {
      const sameOrigin = requireSameOriginMutation(req.headers, { allowedOrigins: readAllowedOriginsFromEnv() })
      if (!sameOrigin.ok) {
        context.res = jsonResponse(sameOrigin.status, { error: sameOrigin.error })
        return
      }
      const adminHdr = requireAdminMutationHeader(req.headers)
      if (!adminHdr.ok) {
        context.res = jsonResponse(adminHdr.status, { error: adminHdr.error })
        return
      }

      const rawContentType = (getHeaderInsensitive(req.headers, 'content-type') ?? '').toLowerCase()
      const contentType = rawContentType.split(';')[0].trim()
      if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
        context.res = jsonResponse(415, { error: `Content-Type must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}.` })
        return
      }

      const bodyBuffer = extractBodyBuffer(req)
      if (!bodyBuffer) {
        context.res = jsonResponse(400, { error: 'Request body must be binary image data.' })
        return
      }
      if (bodyBuffer.byteLength > MAX_IMAGE_BYTES) {
        context.res = jsonResponse(413, { error: 'Image exceeds maximum size of 2 MB.' })
        return
      }

      await writeProfileImage(slug, bodyBuffer, contentType)
      context.res = jsonResponse(200, { ok: true })
      return
    }

    if (method === 'DELETE') {
      const sameOrigin = requireSameOriginMutation(req.headers, { allowedOrigins: readAllowedOriginsFromEnv() })
      if (!sameOrigin.ok) {
        context.res = jsonResponse(sameOrigin.status, { error: sameOrigin.error })
        return
      }
      const adminHdr = requireAdminMutationHeader(req.headers)
      if (!adminHdr.ok) {
        context.res = jsonResponse(adminHdr.status, { error: adminHdr.error })
        return
      }

      await deleteProfileImage(slug)
      context.res = jsonResponse(200, { ok: true })
      return
    }

    context.res = jsonResponse(405, { error: 'Method not allowed.' })
  } catch (e: any) {
    context.res = jsonResponse(500, { error: e?.message ? String(e.message) : 'Internal server error.' })
  }
}
