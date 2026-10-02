import { parseBranding, readBranding, writeBranding } from '../lib/branding'
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
  }
}

export default async function (context: Context, req: HttpRequest) {
  try {
    const auth = requireAdmin(req.headers)
    if (!auth.ok) {
      context.res = jsonResponse(auth.status, { error: 'Unauthorized' })
      return
    }

    const slug = (process.env.CV_PROFILE_SLUG ?? '').trim()
    if (!slug) {
      context.res = jsonResponse(500, { error: 'CV_PROFILE_SLUG is not configured.' })
      return
    }

    const method = (req.method ?? '').toUpperCase()

    if (method === 'GET') {
      context.res = jsonResponse(200, await readBranding(slug))
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

      const parsed = parseBranding(req.body)
      if (!parsed.ok) {
        context.res = jsonResponse(400, { error: parsed.error })
        return
      }

      await writeBranding(slug, parsed.value)
      context.res = jsonResponse(200, parsed.value)
      return
    }

    context.res = jsonResponse(405, { error: 'Method not allowed' })
  } catch (e: unknown) {
    context.res = jsonResponse(500, { error: e instanceof Error && e.message ? e.message : 'Internal server error.' })
  }
}
