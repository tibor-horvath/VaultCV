export type CvBasics = {
  name: string
  headline: string
  photoDataUrl?: string
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
  role: string
  start: string
  end?: string
  location?: string
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
  hobbyProjects?: CvProject[]
  education?: CvEducation[]
}

