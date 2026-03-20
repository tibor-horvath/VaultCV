export type CvBasics = {
  name: string
  headline: string
  email?: string
  // Stored as raw base64 to keep CV_JSON env vars small.
  photoBase64?: string
  photoMimeType?: string
  photoAlt?: string
  location?: string
  summary?: string
}

export type CvLink = {
  label: string
  url: string
}

export type CvCredentialIssuer = 'microsoft' | 'aws' | 'google' | 'other'

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

