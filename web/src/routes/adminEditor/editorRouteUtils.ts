import type {
  CredentialRow,
  EducationRow,
  ExperienceRow,
  LinkRow,
  ProjectRow,
  PublicBasicsFlags,
  PublicCredentialFlags,
  PublicEducationFlags,
  PublicExperienceFlags,
  PublicLinkFlags,
  PublicProjectFlags,
  PublicSectionsFlags,
} from './types'
import { asArray, asObject, asString } from './utils'

export function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && typeof error.message === 'string' && error.message.trim()) return error.message
  return fallback
}

export function hasAnyEnabledFlag(flags: Record<string, boolean> | undefined) {
  if (!flags) return false
  return Object.values(flags).some(Boolean)
}

export function normalizeExperienceLinks(input: unknown): LinkRow[] {
  const links = asArray(input)
    .map((x) => {
      const o = asObject(x)
      const label = asString(o.label).trim()
      const url = asString(o.url).trim()
      if (!label || !url) return null
      return { label, url }
    })
    .filter((x): x is LinkRow => Boolean(x))
  return links
}

export type PublicValidation = {
  basics: Partial<Record<keyof PublicBasicsFlags, string>>
  sections: Partial<Record<keyof PublicSectionsFlags, string>>
  links: string[]
  credentials: string[]
  experience: string[]
  education: string[]
  projects: string[]
}

export type PrivateValidation = {
  links: string[]
  credentials: string[]
  experience: string[]
  education: string[]
  projects: string[]
}

export function emptyPublicValidation(): PublicValidation {
  return {
    basics: {},
    sections: {},
    links: [],
    credentials: [],
    experience: [],
    education: [],
    projects: [],
  }
}

export function emptyPrivateValidation(): PrivateValidation {
  return {
    links: [],
    credentials: [],
    experience: [],
    education: [],
    projects: [],
  }
}

export function hasPublicValidationErrors(validation: PublicValidation) {
  return (
    Object.keys(validation.basics).length > 0 ||
    Object.keys(validation.sections).length > 0 ||
    validation.links.some(Boolean) ||
    validation.credentials.some(Boolean) ||
    validation.experience.some(Boolean) ||
    validation.education.some(Boolean) ||
    validation.projects.some(Boolean)
  )
}

export function hasPrivateValidationErrors(validation: PrivateValidation) {
  return (
    validation.links.some(Boolean) ||
    validation.credentials.some(Boolean) ||
    validation.experience.some(Boolean) ||
    validation.education.some(Boolean) ||
    validation.projects.some(Boolean)
  )
}

export function buildDraftSignature(input: {
  basicsName: string
  basicsHeadline: string
  basicsEmail: string
  basicsMobile: string
  basicsLocation: string
  basicsSummary: string
  basicsPhotoAlt: string
  hasProfileImage: boolean
  skillsText: string
  languagesText: string
  links: LinkRow[]
  credentials: CredentialRow[]
  experience: ExperienceRow[]
  education: EducationRow[]
  projects: ProjectRow[]
  publicBasics: PublicBasicsFlags
  publicSections: PublicSectionsFlags
  publicLinks: PublicLinkFlags[]
  publicCredentials: PublicCredentialFlags[]
  publicExperience: PublicExperienceFlags[]
  publicEducation: PublicEducationFlags[]
  publicProjects: PublicProjectFlags[]
}) {
  return JSON.stringify(input)
}

export function focusFirstValidationIssue(validation: PublicValidation) {
  const firstBasicsKey = Object.keys(validation.basics)[0] as keyof PublicBasicsFlags | undefined
  const basicsByKey: Record<keyof PublicBasicsFlags, string> = {
    name: 'basics-name',
    headline: 'basics-headline',
    location: 'basics-location',
    summary: 'basics-summary',
    photo: 'basics-photo-alt',
  }
  if (firstBasicsKey) {
    document.getElementById(basicsByKey[firstBasicsKey])?.focus()
    return
  }
  if (validation.sections.skills) {
    document.getElementById('skills-text')?.focus()
    return
  }
  if (validation.sections.languages) {
    document.getElementById('languages-text')?.focus()
  }
}

export function mergeRowErrors(primary: string[] | undefined, secondary: string[] | undefined) {
  if (!primary?.length && !secondary?.length) return undefined
  const max = Math.max(primary?.length ?? 0, secondary?.length ?? 0)
  const out: string[] = []
  for (let idx = 0; idx < max; idx += 1) {
    out[idx] = secondary?.[idx] || primary?.[idx] || ''
  }
  return out
}

export function clearChangedRowErrorsWithoutFlags<T>(params: { previousRows: T[]; nextRows: T[]; currentErrors: string[] }) {
  const { previousRows, nextRows, currentErrors } = params
  if (!currentErrors.some(Boolean)) return null
  const max = Math.max(previousRows.length, nextRows.length, currentErrors.length)
  let changed = false
  const nextErrors = [...currentErrors]
  for (let idx = 0; idx < max; idx += 1) {
    const rowChanged = previousRows[idx] !== nextRows[idx]
    if (rowChanged && nextErrors[idx]) {
      nextErrors[idx] = ''
      changed = true
    }
  }
  return changed ? nextErrors : null
}

export function clearChangedRowErrors<T, U>(params: {
  previousRows: T[]
  nextRows: T[]
  previousFlags: U[]
  nextFlags: U[]
  currentErrors: string[]
}) {
  const { previousRows, nextRows, previousFlags, nextFlags, currentErrors } = params
  if (!currentErrors.some(Boolean)) return null

  const max = Math.max(previousRows.length, nextRows.length, previousFlags.length, nextFlags.length, currentErrors.length)
  let changed = false
  const nextErrors = [...currentErrors]
  for (let idx = 0; idx < max; idx += 1) {
    const rowChanged = previousRows[idx] !== nextRows[idx]
    const flagsChanged = previousFlags[idx] !== nextFlags[idx]
    if ((rowChanged || flagsChanged) && nextErrors[idx]) {
      nextErrors[idx] = ''
      changed = true
    }
  }
  return changed ? nextErrors : null
}

