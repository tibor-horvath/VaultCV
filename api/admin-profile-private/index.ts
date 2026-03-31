import { readProfileJson, writeProfileJson } from '../lib/profileBlobStore'
import { requireAdminMutationHeader, requireJsonContentType, requireSameOriginMutation } from '../lib/adminRequestGuards'
import { requireAdmin } from '../lib/swaAuth'

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
  body?: unknown
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

export default async function (context: Context, req: HttpRequest) {
  const auth = requireAdmin(req.headers)
  if (!auth.ok) {
    context.res = jsonResponse(401, { error: 'Unauthorized' })
    return
  }

  const method = (req.method ?? '').toUpperCase()
  if (method === 'GET') {
    const jsonText = await readProfileJson('private')
    context.res = jsonResponse(200, { json: jsonText })
    return
  }

  if (method === 'PUT') {
    const sameOrigin = requireSameOriginMutation(req.headers)
    if (!sameOrigin.ok) {
      context.res = jsonResponse(sameOrigin.status, { error: sameOrigin.error })
      return
    }
    const adminHdr = requireAdminMutationHeader(req.headers)
    if (!adminHdr.ok) {
      context.res = jsonResponse(adminHdr.status, { error: adminHdr.error })
      return
    }
    const jsonCt = requireJsonContentType(req.headers)
    if (!jsonCt.ok) {
      context.res = jsonResponse(jsonCt.status, { error: jsonCt.error })
      return
    }

    const payload = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : null
    const json = typeof payload?.json === 'string' ? payload.json : ''
    const maxBytes = 256 * 1024
    if (Buffer.byteLength(json, 'utf8') > maxBytes) {
      context.res = jsonResponse(413, { error: 'Profile JSON too large.' })
      return
    }
    try {
      JSON.parse(json)
    } catch {
      context.res = jsonResponse(400, { error: 'Invalid JSON.' })
      return
    }
    await writeProfileJson('private', json)
    context.res = jsonResponse(200, { ok: true })
    return
  }

  context.res = jsonResponse(405, { error: 'Method not allowed' })
}

