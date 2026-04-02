import { readAllowedOriginsFromEnv, requireAdminMutationHeader, requireJsonContentType, requireSameOriginMutation } from '../lib/adminRequestGuards'
import { fallbackLocale, invalidateLocalesCache, parseLocale, readSupportedLocalesFromBlob } from '../lib/localeRegistry'
import { writeSettingsJson } from '../lib/profileBlobStore'
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

function readServerConfiguredProfileSlug() {
  return (process.env.CV_PROFILE_SLUG ?? '').trim()
}

function parseSupportedLocalesPayload(body: unknown) {
  const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  const supportedLocalesRaw = Array.isArray(payload?.supportedLocales) ? payload.supportedLocales : null
  if (!supportedLocalesRaw) {
    return { ok: false as const, error: 'supportedLocales must be an array.' }
  }

  const supportedLocales: string[] = []
  for (const raw of supportedLocalesRaw) {
    if (typeof raw !== 'string') continue
    const parsed = parseLocale(raw)
    if (!parsed) continue
    if (!supportedLocales.includes(parsed)) supportedLocales.push(parsed)
  }

  if (!supportedLocales.length) {
    return { ok: false as const, error: 'At least one supported locale is required.' }
  }
  if (!supportedLocales.includes(fallbackLocale)) {
    return { ok: false as const, error: `${fallbackLocale} must be included in supported locales.` }
  }

  return { ok: true as const, supportedLocales }
}

export default async function (context: Context, req: HttpRequest) {
  try {
    const auth = requireAdmin(req.headers)
    if (!auth.ok) {
      context.res = jsonResponse(401, { error: 'Unauthorized' })
      return
    }

    const slugFromName = readServerConfiguredProfileSlug()
    if (!slugFromName) {
      context.res = jsonResponse(500, { error: 'CV_PROFILE_SLUG is not configured.' })
      return
    }

    const method = (req.method ?? '').toUpperCase()
    if (method === 'GET') {
      const supportedLocales = await readSupportedLocalesFromBlob(slugFromName)
      context.res = jsonResponse(200, { supportedLocales: supportedLocales ?? [] })
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
      const jsonCt = requireJsonContentType(req.headers)
      if (!jsonCt.ok) {
        context.res = jsonResponse(jsonCt.status, { error: jsonCt.error })
        return
      }

      const parsedPayload = parseSupportedLocalesPayload(req.body)
      if (!parsedPayload.ok) {
        context.res = jsonResponse(400, { error: parsedPayload.error })
        return
      }

      await writeSettingsJson({
        slugFromName,
        jsonText: JSON.stringify({ supportedLocales: parsedPayload.supportedLocales }),
      })
      invalidateLocalesCache()
      context.res = jsonResponse(200, {})
      return
    }

    context.res = jsonResponse(405, { error: 'Method not allowed' })
  } catch (e: any) {
    context.res = jsonResponse(500, { error: e?.message ? String(e.message) : 'Internal server error.' })
  }
}
