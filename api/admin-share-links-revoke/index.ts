import { revokeShareLink } from '../lib/shareLinksTable'
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

  const id = (req.params?.id ?? '').trim()
  if (!id) {
    context.res = jsonResponse(400, { error: 'Missing id.' })
    return
  }

  const ok = await revokeShareLink(id)
  if (!ok) {
    context.res = jsonResponse(404, { error: 'Not found.' })
    return
  }
  context.res = jsonResponse(200, { ok: true })
}

