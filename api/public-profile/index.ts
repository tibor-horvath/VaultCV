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

const mockPublicProfile = {
  name: 'John Doe',
  title: 'Cloud Engineer',
  location: 'Prague, Czechia',
  focus: 'Cloud Engineer, Azure/AWS',
  bio: 'Building reliable cloud-native products with clean UX, strong security, and fast delivery.',
  links: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/your-handle/' },
    { label: 'GitHub', url: 'https://github.com/your-handle' },
  ],
  tags: ['Cloud', 'Azure', 'AWS', 'TypeScript', 'React'],
}

export default async function (context: Context, _req: HttpRequest) {
  const raw = process.env.PUBLIC_PROFILE_JSON ?? ''

  if (!raw) {
    // Default to mock so the landing page still works in dev environments
    // even when you haven't configured the SWA Application settings yet.
    context.res = jsonResponse(200, mockPublicProfile)
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

