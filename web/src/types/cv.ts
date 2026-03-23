export type CvBasics = {
  name: string
  headline: string
  email?: string
  // Direct URL to profile photo (e.g. Azure Blob URL with SAS query).
  photoUrl?: string
  photoAlt?: string
  location?: string
  summary?: string
}

export type CvLink = {
  label: string
  url: string
}

export type CvCredentialIssuer = 'microsoft' | 'aws' | 'google' | 'language' | 'other'

export type CvCredential = {
  issuer: CvCredentialIssuer
  label: string
  url: string
  /**
   * When the certificate/credential was earned (e.g. "2024", "2024-05").
   * Optional to keep existing PRIVATE_PROFILE_JSON payloads working.
   */
  dateEarned?: string
  /**
   * When the credential expires / needs renewal (e.g. "2026", "2026-11").
   * Optional; if omitted, the UI won't show expiration info.
   */
  dateExpires?: string
}

export type CvExperience = {
  /** Stable key for list rendering; optional when composite fields uniquely identify the row. */
  id?: string
  company: string
  companyUrl?: string
  companyLinkedInUrl?: string
  role: string
  start: string
  end?: string
  location?: string
  skills?: string[]
  highlights: string[]
}

export type CvProject = {
  name: string
  description: string
  links?: CvLink[]
  tags?: string[]
}

export type CvEducation = {
  /** Stable key for list rendering; optional when composite fields uniquely identify the row. */
  id?: string
  school: string
  program: string
  start?: string
  end?: string
  location?: string
  highlights?: string[]
}

export type CvData = {
  basics: CvBasics
  links?: CvLink[]
  credentials?: CvCredential[]
  skills?: string[]
  languages?: string[]
  experience?: CvExperience[]
  projects?: CvProject[]
  education?: CvEducation[]
}

