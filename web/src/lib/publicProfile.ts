import type { Locale } from './i18n.tsx'

export type PublicLink = {
  label: string
  url: string
}

export type PublicData = {
  locale?: string
  name: string
  title: string
  location: string
  focus: string
  bio: string
  links: PublicLink[]
  skills: string[]
}

export const defaultPublicData: PublicData = {
  locale: 'en',
  name: 'John Doe',
  title: 'Cloud Engineer',
  location: 'Prague, Czechia',
  focus: 'Cloud Engineer, Azure/AWS',
  bio: 'Building reliable cloud-native products with clean UX, strong security, and fast delivery.',
  links: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/your-handle/' },
    { label: 'GitHub', url: 'https://github.com/your-handle' },
  ],
  skills: ['Cloud', 'Azure', 'AWS', 'TypeScript', 'React'],
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

  const rawSkills = obj.skills ?? obj.tags
  const skills = Array.isArray(rawSkills)
    ? rawSkills.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean)
    : undefined

  return {
    locale: typeof obj.locale === 'string' ? obj.locale.trim() : undefined,
    name: typeof obj.name === 'string' ? obj.name.trim() : undefined,
    title: typeof obj.title === 'string' ? obj.title.trim() : undefined,
    location: typeof obj.location === 'string' ? obj.location.trim() : undefined,
    focus: typeof obj.focus === 'string' ? obj.focus.trim() : undefined,
    bio: typeof obj.bio === 'string' ? obj.bio.trim() : undefined,
    links,
    skills,
  }
}

export function mergePublicData(base: PublicData, incoming: Partial<PublicData>): PublicData {
  return {
    ...base,
    ...incoming,
    links: incoming.links ?? base.links,
    skills: incoming.skills ?? base.skills,
  }
}

function localeCandidates(locale: Locale) {
  const normalized = locale.trim().toLowerCase()
  const base = normalized.split('-')[0]
  return normalized === base ? [base] : [normalized, base]
}

export async function fetchPublicProfile(locale: Locale): Promise<Partial<PublicData>> {
  try {
    const apiRes = await fetch(`/api/public-profile?lang=${encodeURIComponent(locale)}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
    })
    if (apiRes.ok) return normalizePublicData((await apiRes.json()) as unknown)
  } catch {
    // Fall through to file fallback.
  }

  for (const candidate of localeCandidates(locale)) {
    try {
      const fileRes = await fetch(`/public-profile.${candidate}.json`, {
        method: 'GET',
        headers: { accept: 'application/json' },
      })
      if (fileRes.ok) return normalizePublicData((await fileRes.json()) as unknown)
    } catch {
      // Try next fallback candidate.
    }
  }

  try {
    const genericFileRes = await fetch('/public-profile.json', {
      method: 'GET',
      headers: { accept: 'application/json' },
    })
    if (!genericFileRes.ok) return {}
    return normalizePublicData((await genericFileRes.json()) as unknown)
  } catch {
    return {}
  }
}
