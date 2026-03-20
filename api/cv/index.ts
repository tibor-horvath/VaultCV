import crypto from 'node:crypto'

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
}

function constantTimeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
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

function isGuidN(token: string) {
  return /^[0-9a-f]{32}$/i.test(token)
}

function parsePhotoBase64Input(photoBase64: string) {
  const trimmed = photoBase64.trim()
  if (!trimmed) return { photoBase64: '', photoMimeType: 'image/jpeg' }

  // If the user already provided a full data URL, extract the mime type + payload.
  if (trimmed.startsWith('data:')) {
    const match = /^data:([^;]+);base64,(.+)$/i.exec(trimmed)
    if (match) {
      return { photoMimeType: match[1], photoBase64: match[2] }
    }
  }

  // Default to JPEG. If you need PNG/GIF/etc, you can set PROFILE_PHOTO_MIME_TYPE too.
  const photoMimeType = process.env.PROFILE_PHOTO_MIME_TYPE?.trim() || 'image/jpeg'
  return { photoMimeType, photoBase64: trimmed }
}

export default async function (context: Context, req: HttpRequest) {
  const token = req.query?.t ?? ''
  const expected = process.env.CV_ACCESS_TOKEN ?? ''

  if (!expected) {
    context.res = jsonResponse(500, { error: 'Server is not configured.' })
    return
  }

  // Enforce GUID tokens to keep access links short and predictable.
  if (!token || !isGuidN(token)) {
    context.res = jsonResponse(400, { error: 'Invalid token format.' })
    return
  }

  if (!isGuidN(expected)) {
    context.res = jsonResponse(500, { error: 'Server token is invalid.' })
    return
  }

  if (!token || !constantTimeEqual(token, expected)) {
    context.res = jsonResponse(401, { error: 'Unauthorized' })
    return
  }

  const raw = process.env.CV_JSON ?? ''
  if (!raw) {
    context.res = jsonResponse(500, { error: 'CV data is not configured.' })
    return
  }

  try {
    const data = JSON.parse(raw) as unknown

    // Allow moving a large photo blob out of `CV_JSON`.
    // If `PROFILE_PHOTO_BASE64` is set, we inject it into `basics.photoBase64`.
    const photoBase64 = process.env.PROFILE_PHOTO_BASE64?.trim() ?? ''
    if (photoBase64 && data && typeof data === 'object') {
      const dataObj = data as Record<string, unknown>
      const basics =
        dataObj.basics && typeof dataObj.basics === 'object' ? (dataObj.basics as Record<string, unknown>) : (dataObj.basics = {})
      const parsed = parsePhotoBase64Input(photoBase64)
      basics.photoBase64 = parsed.photoBase64
      basics.photoMimeType = parsed.photoMimeType
    }

    context.res = jsonResponse(200, data)
  } catch (err) {
    context.log('Failed parsing CV_JSON', err)
    context.res = jsonResponse(500, { error: 'CV data is invalid JSON.' })
  }
}

