import { revokeShareLink } from '../lib/shareLinksTable'
import { requireAdminMutationHeader, requireSameOriginMutation } from '../lib/adminRequestGuards'
import { requireAdmin } from '../lib/swaAuth'

type Context = {
  res?: {
    status: number
    headers?: Record<string, string>
    body?: unknown
  }
}

type HttpRequest = {
  params?: Record<string, string | undefined>
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

export default async function (context: Context, req: HttpRequest) {
  const auth = requireAdmin(req.headers)
  if (!auth.ok) {
    context.res = jsonResponse(401, { error: 'Unauthorized' })
    return
  }

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

  const id = (req.params?.id ?? '').trim()
  if (!id) {
    context.res = jsonResponse(400, { error: 'Missing id.' })
    return
  }
  if (id.length > 128) {
    context.res = jsonResponse(400, { error: 'Invalid id.' })
    return
  }
  // Share ids are base64url; accept a conservative charset.
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    context.res = jsonResponse(400, { error: 'Invalid id.' })
    return
  }

  const ok = await revokeShareLink(id)
  if (!ok) {
    context.res = jsonResponse(404, { error: 'Not found.' })
    return
  }
  context.res = jsonResponse(200, { ok: true })
}

