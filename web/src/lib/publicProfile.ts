import type { Locale } from './i18n.tsx'
import type { CvAward, CvData, CvLink } from '../types/cv'

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

function normalizeAwards(value: unknown): CvAward[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items: CvAward[] = value
    .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object' && !Array.isArray(x)))
    .map((x) => {
      const title = normalizeString(x.title)
      if (!title) return null
      const issuer = normalizeString(x.issuer)
      const year = normalizeString(x.year)
      const out: CvAward = { title }
      if (issuer) out.issuer = issuer
      if (year) out.year = year
      return out
    })
    .filter((x): x is CvAward => x != null)
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
    hobbiesInterests: normalizeStringArray(obj.hobbiesInterests),
    awards: normalizeAwards(obj.awards),
    // The public page can optionally show these if present in public JSON.
    credentials: Array.isArray(obj.credentials) ? (obj.credentials as any) : undefined,
    experience: Array.isArray(obj.experience) ? (obj.experience as any) : undefined,
    projects: Array.isArray(obj.projects) ? (obj.projects as any) : undefined,
    education: Array.isArray(obj.education) ? (obj.education as any) : undefined,
  }
}

export function normalizeCvDataFromPublicPayload(input: unknown): Partial<CvData> {
  return normalizeCvDataFromCvData(input)
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
    // Public CV data is served by the API.
  }

  return {}
}
