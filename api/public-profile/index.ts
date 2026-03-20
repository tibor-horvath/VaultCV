type Context = {
  log: (...args: unknown[]) => void
  res?: {
    status: number
    headers?: Record<string, string>
    body?: unknown
  }
}

type HttpRequest = {
  query?: Record<string, string | undefined>
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

export default async function (context: Context, _req: HttpRequest) {
  const raw = process.env.PUBLIC_PROFILE_JSON ?? ''

  if (!raw) {
    // Keep API and web fallback data separate to avoid drift.
    // The web app can still use `/public-profile.json` if this env var is unset.
    context.res = jsonResponse(404, { error: 'PUBLIC_PROFILE_JSON is not configured.' })
    return
  }

  try {
    const data = JSON.parse(raw) as unknown
    context.res = jsonResponse(200, data)
  } catch (err) {
    context.log('Failed parsing PUBLIC_PROFILE_JSON', err)
    context.res = jsonResponse(500, { error: 'PUBLIC_PROFILE_JSON is invalid JSON.' })
  }
}

