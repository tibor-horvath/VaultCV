import { createShareLink, listShareLinks } from '../lib/shareLinksTable'
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

function nowEpochSeconds() {
  return Math.floor(Date.now() / 1000)
}

export default async function (context: Context, req: HttpRequest) {
  const auth = requireAdmin(req.headers)
  if (!auth.ok) {
    context.res = jsonResponse(401, { error: 'Unauthorized' })
    return
  }

  const method = (req.method ?? '').toUpperCase()
  if (method === 'GET') {
    const links = await listShareLinks(200)
    context.res = jsonResponse(200, { links })
    return
  }

  if (method === 'POST') {
    const payload = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : null
    const notes = typeof payload?.notes === 'string' ? payload.notes : undefined

    const expiresAtEpoch =
      typeof payload?.expiresAtEpoch === 'number'
        ? payload.expiresAtEpoch
        : typeof payload?.expiresInDays === 'number'
          ? nowEpochSeconds() + Math.floor(payload.expiresInDays * 24 * 60 * 60)
          : 0

    if (!expiresAtEpoch) {
      context.res = jsonResponse(400, { error: 'Missing expiresAtEpoch (or expiresInDays).' })
      return
    }

    const created = await createShareLink({ notes, expiresAtEpoch })
    context.res = jsonResponse(201, { id: created.id })
    return
  }

  context.res = jsonResponse(405, { error: 'Method not allowed' })
}

