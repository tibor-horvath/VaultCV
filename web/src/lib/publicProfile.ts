import type { Locale } from './i18n.tsx'
import type { CvData, CvLink } from '../types/cv'

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

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return undefined
  const items = value.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean)
  return items.length ? items : undefined
}

function normalizeLinks(value: unknown): CvLink[] | undefined {
  if (!Array.isArray(value)) return undefined
  const links = value
    .filter((x): x is { label: unknown; url: unknown } => Boolean(x && typeof x === 'object'))
    .map((x) => ({
      label: normalizeString(x.label),
      url: normalizeString(x.url),
    }))
    .filter((x) => x.label && isHttpUrl(x.url))

  return links.length ? links : undefined
}

function normalizeCvDataFromCvData(input: unknown): Partial<CvData> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  const obj = input as Record<string, unknown>
  const basicsRaw = obj.basics
  if (!basicsRaw || typeof basicsRaw !== 'object' || Array.isArray(basicsRaw)) return {}
  const basicsObj = basicsRaw as Record<string, unknown>

  const name = normalizeString(basicsObj.name)
  const headline = normalizeString(basicsObj.headline)

  return {
    locale: normalizeString(obj.locale) || undefined,
    basics: {
      name,
      headline,
      email: normalizeString(basicsObj.email) || undefined,
      mobile: normalizeString(basicsObj.mobile) || undefined,
      photoUrl: normalizeString(basicsObj.photoUrl) || undefined,
      photoAlt: normalizeString(basicsObj.photoAlt) || undefined,
      location: normalizeString(basicsObj.location) || undefined,
      summary: normalizeString(basicsObj.summary) || undefined,
    },
    links: normalizeLinks(obj.links),
    skills: normalizeStringArray(obj.skills),
    languages: normalizeStringArray(obj.languages),
    // The public page can optionally show these if present in public JSON.
    credentials: Array.isArray(obj.credentials) ? (obj.credentials as any) : undefined,
    experience: Array.isArray(obj.experience) ? (obj.experience as any) : undefined,
    projects: Array.isArray(obj.projects) ? (obj.projects as any) : undefined,
    education: Array.isArray(obj.education) ? (obj.education as any) : undefined,
  }
}

function normalizeCvDataFromLegacyPublicData(input: unknown): Partial<CvData> {
  const legacy = normalizePublicData(input)
  const name = (legacy.name ?? '').trim()
  const headline = (legacy.title ?? '').trim()
  const links = legacy.links?.map((x) => ({ label: x.label, url: x.url })).filter((x) => x.label && isHttpUrl(x.url))
  const skills = legacy.skills?.filter(Boolean)

  return {
    locale: legacy.locale,
    basics: {
      name,
      headline,
      location: legacy.location?.trim() || undefined,
      summary: legacy.bio?.trim() || undefined,
    },
    links: links?.length ? links : undefined,
    skills: skills?.length ? skills : undefined,
  }
}

export function normalizeCvDataFromPublicPayload(input: unknown): Partial<CvData> {
  const fromCv = normalizeCvDataFromCvData(input)
  if (fromCv.basics) return fromCv
  return normalizeCvDataFromLegacyPublicData(input)
}

export function normalizePublicData(input: unknown): Partial<PublicData> {
  // If we receive unified CvData-shaped payloads, map them into PublicData for legacy consumers.
  const asCv = normalizeCvDataFromCvData(input)
  if (asCv.basics) {
    return {
      locale: asCv.locale,
      name: asCv.basics.name,
      title: asCv.basics.headline,
      location: asCv.basics.location ?? '',
      focus: asCv.basics.headline,
      bio: asCv.basics.summary ?? '',
      links: (asCv.links ?? []) as any,
      skills: asCv.skills ?? [],
    }
  }

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
    const apiRes = await fetch('/api/public-profile', {
      method: 'GET',
      headers: { accept: 'application/json', 'accept-language': locale },
    })
    if (apiRes.ok) {
      const payload = (await apiRes.json()) as unknown
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        const obj = payload as Record<string, unknown>
        const wrappedJson = typeof obj.json === 'string' ? obj.json : ''
        if (wrappedJson.trim()) {
          try {
            return normalizePublicData(JSON.parse(wrappedJson) as unknown)
          } catch {
            return {}
          }
        }
      }
      return normalizePublicData(payload)
    }
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

export async function fetchPublicCvProfile(locale: Locale): Promise<Partial<CvData>> {
  try {
    const apiRes = await fetch('/api/public-profile', {
      method: 'GET',
      headers: { accept: 'application/json', 'accept-language': locale },
    })
    if (apiRes.ok) {
      const payload = (await apiRes.json()) as unknown
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        const obj = payload as Record<string, unknown>
        const wrappedJson = typeof obj.json === 'string' ? obj.json : ''
        if (wrappedJson.trim()) {
          try {
            return normalizeCvDataFromPublicPayload(JSON.parse(wrappedJson) as unknown)
          } catch {
            return {}
          }
        }
      }
      return normalizeCvDataFromPublicPayload(payload)
    }
  } catch {
    // No file fallback here: public CV data is now served by the API (with legacy behavior on the server).
  }

  return {}
}
