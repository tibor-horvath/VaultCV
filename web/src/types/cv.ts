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
}

export type CvExperience = {
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

