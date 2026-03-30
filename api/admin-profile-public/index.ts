import { readProfileJson, writeProfileJson } from '../lib/profileBlobStore'
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
    const jsonText = await readProfileJson('public')
    context.res = jsonResponse(200, { json: jsonText })
    return
  }

  if (method === 'PUT') {
    const payload = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : null
    const json = typeof payload?.json === 'string' ? payload.json : ''
    try {
      JSON.parse(json)
    } catch {
      context.res = jsonResponse(400, { error: 'Invalid JSON.' })
      return
    }
    await writeProfileJson('public', json)
    context.res = jsonResponse(200, { ok: true })
    return
  }

  context.res = jsonResponse(405, { error: 'Method not allowed' })
}

