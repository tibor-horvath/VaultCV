export type LocaleItem = { locale: string; label?: string }

export type PublicBasicsFlags = {
  name: boolean
  headline: boolean
  location: boolean
  summary: boolean
  photoAlt: boolean
}

export type PublicSectionsFlags = {
  skills: boolean
  languages: boolean
}

export type LinkRow = { label: string; url: string }
export type PublicLinkFlags = { label: boolean; url: boolean }

export type CredentialRow = { issuer: string; label: string; url: string; dateEarned?: string; dateExpires?: string }
export type PublicCredentialFlags = { issuer: boolean; label: boolean; url: boolean }

export type ExperienceRow = {
  company: string
  companyUrl?: string
  companyLinkedInUrl?: string
  role: string
  start: string
  end: string
  location?: string
  skills?: string[]
  highlights?: string[]
}
export type PublicExperienceFlags = {
  company: boolean
  companyUrl: boolean
  companyLinkedInUrl: boolean
  role: boolean
  start: boolean
  end: boolean
  location: boolean
  skills: boolean
  highlights: boolean
}

export type EducationRow = {
  school: string
  schoolUrl?: string
  degree?: string
  field?: string
  program?: string
  start?: string
  end?: string
  location?: string
  gpa?: string
  highlights?: string[]
}
export type PublicEducationFlags = {
  school: boolean
  schoolUrl: boolean
  degree: boolean
  field: boolean
  program: boolean
  start: boolean
  end: boolean
  location: boolean
  highlights: boolean
}

export type ProjectRow = { name: string; description: string; tags?: string[]; links?: Array<{ label: string; url: string }> }
export type PublicProjectFlags = { name: boolean; tags: boolean; description: boolean }

