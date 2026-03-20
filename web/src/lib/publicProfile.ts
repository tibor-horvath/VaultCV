export type PublicLink = {
  label: string
  url: string
}

export type PublicData = {
  name: string
  title: string
  location: string
  focus: string
  bio: string
  links: PublicLink[]
  tags: string[]
}

export const defaultPublicData: PublicData = {
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

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizePublicData(input: unknown): Partial<PublicData> {
  if (!input || typeof input !== 'object') return {}
  const obj = input as Record<string, unknown>

  const links = Array.isArray(obj.links)
    ? obj.links
        .filter((x): x is { label: unknown; url: unknown } => Boolean(x && typeof x === 'object'))
        .map((x) => ({
          label: typeof x.label === 'string' ? x.label.trim() : '',
          url: typeof x.url === 'string' ? x.url.trim() : '',
        }))
        .filter((x) => x.label && isHttpUrl(x.url))
    : undefined

  const tags = Array.isArray(obj.tags)
    ? obj.tags.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean)
    : undefined

  return {
    name: typeof obj.name === 'string' ? obj.name.trim() : undefined,
    title: typeof obj.title === 'string' ? obj.title.trim() : undefined,
    location: typeof obj.location === 'string' ? obj.location.trim() : undefined,
    focus: typeof obj.focus === 'string' ? obj.focus.trim() : undefined,
    bio: typeof obj.bio === 'string' ? obj.bio.trim() : undefined,
    links,
    tags,
  }
}

export function mergePublicData(base: PublicData, incoming: Partial<PublicData>): PublicData {
  return {
    ...base,
    ...incoming,
    links: incoming.links ?? base.links,
    tags: incoming.tags ?? base.tags,
  }
}

export async function fetchPublicProfile(): Promise<Partial<PublicData>> {
  try {
    const apiRes = await fetch('/api/public-profile', {
      method: 'GET',
      headers: { accept: 'application/json' },
    })
    if (apiRes.ok) return normalizePublicData((await apiRes.json()) as unknown)
  } catch {
    // Fall through to file fallback.
  }

  try {
    const fileRes = await fetch('/public-profile.json', {
      method: 'GET',
      headers: { accept: 'application/json' },
    })
    if (!fileRes.ok) return {}
    return normalizePublicData((await fileRes.json()) as unknown)
  } catch {
    return {}
  }
}
