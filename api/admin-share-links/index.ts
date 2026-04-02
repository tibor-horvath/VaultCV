import { createShareLink, listShareLinks } from '../lib/shareLinksTable'
import { readAllowedOriginsFromEnv, requireAdminMutationHeader, requireJsonContentType, requireSameOriginMutation } from '../lib/adminRequestGuards'
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

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.trunc(n)))
}

export default async function (context: Context, req: HttpRequest) {
  const auth = requireAdmin(req.headers)
  if (!auth.ok) {
    context.res = jsonResponse(auth.status, { error: 'Unauthorized' })
    return
  }

  const method = (req.method ?? '').toUpperCase()
  if (method === 'GET') {
    const links = await listShareLinks(200)
    context.res = jsonResponse(200, { links })
    return
  }

  if (method === 'POST') {
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
    const jsonCt = requireJsonContentType(req.headers)
    if (!jsonCt.ok) {
      context.res = jsonResponse(jsonCt.status, { error: jsonCt.error })
      return
    }

    const payload = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : null
    const notes = typeof payload?.notes === 'string' ? payload.notes : undefined

    const now = nowEpochSeconds()
    const maxDays = 365
    const expiresInDays =
      typeof payload?.expiresInDays === 'number' ? clampInt(payload.expiresInDays, 1, maxDays) : undefined

    const requestedExpiresAtEpoch = typeof payload?.expiresAtEpoch === 'number' ? payload.expiresAtEpoch : undefined
    const computedExpiresAtEpoch = expiresInDays != null ? now + expiresInDays * 24 * 60 * 60 : undefined
    const expiresAtEpoch = requestedExpiresAtEpoch ?? computedExpiresAtEpoch ?? 0

    if (!expiresAtEpoch) {
      context.res = jsonResponse(400, { error: 'Missing expiresAtEpoch (or expiresInDays).' })
      return
    }
    if (!Number.isFinite(expiresAtEpoch) || expiresAtEpoch <= now) {
      context.res = jsonResponse(400, { error: 'expiresAtEpoch must be a future epoch seconds value.' })
      return
    }
    if (expiresAtEpoch > now + maxDays * 24 * 60 * 60) {
      context.res = jsonResponse(400, { error: `expiresAtEpoch must be within ${maxDays} days.` })
      return
    }
    const created = await createShareLink({ notes, expiresAtEpoch })
    context.res = jsonResponse(201, { id: created.id })
    return
  }

  context.res = jsonResponse(405, { error: 'Method not allowed' })
}

