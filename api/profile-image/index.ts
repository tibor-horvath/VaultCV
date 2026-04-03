import { deleteProfileImage, readProfileImage, writeProfileImage } from '../lib/profileBlobStore'
import { readAllowedOriginsFromEnv, requireAdminMutationHeader, requireSameOriginMutation } from '../lib/adminRequestGuards'
import { requireAdmin } from '../lib/swaAuth'

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

export default async function (context: Context, req: HttpRequest) {
  try {
    const auth = requireAdmin(req.headers)
    if (!auth.ok) {
      context.res = jsonResponse(auth.status, { error: 'Unauthorized' })
      return
    }

    const slug = readServerConfiguredProfileSlug()
    if (!slug) {
      context.res = jsonResponse(500, { error: 'CV_PROFILE_SLUG is not configured.' })
      return
    }

    const method = (req.method ?? '').toUpperCase()

    if (method === 'HEAD' || method === 'GET') {
      const image = await readProfileImage(slug)
      if (!image) {
        context.res = { status: 404, headers: { 'cache-control': 'no-store' } }
        return
      }
      if (method === 'HEAD') {
        context.res = {
          status: 200,
          headers: {
            'content-type': image.contentType,
            'cache-control': 'no-store',
            'content-length': String(image.buffer.byteLength),
          },
        }
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

      // Accept JSON body: { data: <base64>, mimeType: "image/jpeg" | "image/png" }
      const jsonBody = req.body as { data?: unknown; mimeType?: unknown } | null | undefined
      const mimeType = typeof jsonBody?.mimeType === 'string' ? jsonBody.mimeType.toLowerCase().trim() : ''
      const base64Data = typeof jsonBody?.data === 'string' ? jsonBody.data : ''

      if (!ALLOWED_CONTENT_TYPES.includes(mimeType)) {
        context.res = jsonResponse(415, { error: `mimeType must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}.` })
        return
      }
      if (!base64Data) {
        context.res = jsonResponse(400, { error: 'Request body must include a base64-encoded "data" field.' })
        return
      }

      let imageBuffer: Buffer
      try {
        imageBuffer = Buffer.from(base64Data, 'base64')
      } catch {
        context.res = jsonResponse(400, { error: 'Invalid base64 data.' })
        return
      }
      if (imageBuffer.byteLength > MAX_IMAGE_BYTES) {
        context.res = jsonResponse(413, { error: 'Image exceeds maximum size of 2 MB.' })
        return
      }

      await writeProfileImage(slug, imageBuffer, mimeType)
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
