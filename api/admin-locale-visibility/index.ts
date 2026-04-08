import { readDisabledLocalesFromBlob, setLocaleDisabled, invalidateLocalesCache, parseLocale, readSupportedLocalesCached } from '../lib/localeRegistry'
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
  query?: Record<string, string | undefined>
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

export default async function (context: Context, req: HttpRequest) {
  try {
    const auth = requireAdmin(req.headers)
    if (!auth.ok) {
      context.res = jsonResponse(auth.status, { error: 'Unauthorized' })
      return
    }

    const slugFromName = readServerConfiguredProfileSlug()
    if (!slugFromName) {
      context.res = jsonResponse(500, { error: 'CV_PROFILE_SLUG is not configured.' })
      return
    }

    const method = (req.method ?? '').toUpperCase()

    if (method === 'GET') {
      const disabledLocales = await readDisabledLocalesFromBlob(slugFromName)
      context.res = jsonResponse(200, { disabledLocales })
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

      const payload = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : null
      const rawLocale = typeof payload?.locale === 'string' ? payload.locale : ''
      if (!rawLocale.trim()) {
        context.res = jsonResponse(400, { error: 'locale is required.' })
        return
      }

      const locale = parseLocale(rawLocale)
      if (!locale) {
        context.res = jsonResponse(400, { error: 'Invalid locale format.' })
        return
      }
      const supported = await readSupportedLocalesCached(slugFromName)
      if (!supported.includes(locale)) {
        context.res = jsonResponse(400, { error: 'Unsupported locale.' })
        return
      }

      const disabled = payload?.disabled === true
      await setLocaleDisabled(slugFromName, locale, disabled)
      invalidateLocalesCache(slugFromName)
      context.res = jsonResponse(200, { ok: true })
      return
    }

    context.res = jsonResponse(405, { error: 'Method not allowed' })
  } catch (e: unknown) {
    context.res = jsonResponse(500, { error: e instanceof Error && e.message ? e.message : 'Internal server error.' })
  }
}
