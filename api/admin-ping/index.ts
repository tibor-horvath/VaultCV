import { requireAdmin } from '../lib/swaAuth'

type Context = {
  res?: {
    status: number
    headers?: Record<string, string>
    body?: unknown
  }
}

type HttpRequest = {
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
  }
}

export default async function (context: Context, req: HttpRequest) {
  const auth = requireAdmin(req.headers)
  if (!auth.ok) {
    context.res = jsonResponse(401, { error: 'Unauthorized' })
    return
  }

  context.res = jsonResponse(200, {
    ok: true,
    endpoint: '/api/admin/ping',
    now: new Date().toISOString(),
  })
}
