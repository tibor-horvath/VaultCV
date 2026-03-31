type Context = {
  res?: {
    status: number
    headers?: Record<string, string>
    body?: unknown
  }
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

export default async function (context: Context) {
  context.res = jsonResponse(200, {
    ok: true,
    endpoint: '/api/probe',
    now: new Date().toISOString(),
  })
}
