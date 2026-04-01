import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, KeyRound, LoaderCircle, Save, Shield } from 'lucide-react'
import { redirectToLogin } from '../lib/authRedirect'
import { AdminEditorHeader } from './adminEditor/AdminEditorHeader'
import { BasicsSection } from './adminEditor/BasicsSection'
import { CredentialsSection } from './adminEditor/CredentialsSection'
import { EducationSection } from './adminEditor/EducationSection'
import { ExperienceSection } from './adminEditor/ExperienceSection'
import { LinksSection } from './adminEditor/LinksSection'
import { ProjectsSection } from './adminEditor/ProjectsSection'
import { SkillsLanguagesSection } from './adminEditor/SkillsLanguagesSection'
import type {
  CredentialRow,
  EducationRow,
  ExperienceRow,
  LinkRow,
  LocaleItem,
  ProjectRow,
  PublicBasicsFlags,
  PublicCredentialFlags,
  PublicEducationFlags,
  PublicExperienceFlags,
  PublicLinkFlags,
  PublicProjectFlags,
  PublicSectionsFlags,
} from './adminEditor/types'
import {
  asArray,
  asObject,
  asString,
  asStringArray,
  readJsonResponse,
  safeJsonParse,
  stringArrayToTextAreaLines,
  textAreaLinesToStringArray,
} from './adminEditor/utils'

type ClientPrincipal = {
  userDetails?: string
  userRoles?: string[]
}

async function fetchAuthMe(): Promise<ClientPrincipal | null> {
  try {
    const res = await fetch('/.auth/me', { credentials: 'same-origin' })
    if (!res.ok) return null
    const text = await res.text()
    if (!text.trim()) return null
    const data = JSON.parse(text) as { clientPrincipal?: ClientPrincipal }
    return data?.clientPrincipal ?? null
  } catch {
    return null
  }
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && typeof error.message === 'string' && error.message.trim()) return error.message
  return fallback
}

function hasAnyEnabledFlag(flags: Record<string, boolean> | undefined) {
  if (!flags) return false
  return Object.values(flags).some(Boolean)
}

function normalizeExperienceLinks(input: unknown): LinkRow[] {
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

type PublicValidation = {
  basics: Partial<Record<keyof PublicBasicsFlags, string>>
  sections: Partial<Record<keyof PublicSectionsFlags, string>>
  links: string[]
  credentials: string[]
  experience: string[]
  education: string[]
  projects: string[]
}

function emptyPublicValidation(): PublicValidation {
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

function hasPublicValidationErrors(validation: PublicValidation) {
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

function buildDraftSignature(input: {
  basicsName: string
  basicsHeadline: string
  basicsEmail: string
  basicsMobile: string
  basicsLocation: string
  basicsSummary: string
  basicsPhotoAlt: string
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

function focusFirstValidationIssue(validation: PublicValidation) {
  const firstBasicsKey = Object.keys(validation.basics)[0] as keyof PublicBasicsFlags | undefined
  const basicsByKey: Record<keyof PublicBasicsFlags, string> = {
    name: 'basics-name',
    headline: 'basics-headline',
    location: 'basics-location',
    summary: 'basics-summary',
    photoAlt: 'basics-photo-alt',
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

function clearChangedRowErrors<T, U>(params: {
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

export function AdminEditorRoute() {
  const [me, setMe] = useState<ClientPrincipal | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const isAdmin = useMemo(() => (me?.userRoles ?? []).includes('admin'), [me])

  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const [locales, setLocales] = useState<LocaleItem[]>([{ locale: 'en', label: 'English' }])
  const [locale, setLocale] = useState('en')

  // Hand-crafted form state (covers the full schema by section).
  const [basicsName, setBasicsName] = useState('')
  const [basicsHeadline, setBasicsHeadline] = useState('')
  const [basicsEmail, setBasicsEmail] = useState('')
  const [basicsMobile, setBasicsMobile] = useState('')
  const [basicsLocation, setBasicsLocation] = useState('')
  const [basicsSummary, setBasicsSummary] = useState('')
  const [basicsPhotoAlt, setBasicsPhotoAlt] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [languagesText, setLanguagesText] = useState('')

  const [links, setLinks] = useState<LinkRow[]>([])
  const [credentials, setCredentials] = useState<CredentialRow[]>([])
  const [experience, setExperience] = useState<ExperienceRow[]>([])
  const [education, setEducation] = useState<EducationRow[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [publicValidation, setPublicValidation] = useState<PublicValidation>(emptyPublicValidation())

  const [publicBasics, setPublicBasics] = useState<PublicBasicsFlags>({
    name: false,
    headline: false,
    location: false,
    summary: false,
    photoAlt: false,
  })
  const [publicSections, setPublicSections] = useState<PublicSectionsFlags>({
    skills: false,
    languages: false,
  })

  const [publicLinks, setPublicLinks] = useState<PublicLinkFlags[]>([])
  const [publicCredentials, setPublicCredentials] = useState<PublicCredentialFlags[]>([])
  const [publicExperience, setPublicExperience] = useState<PublicExperienceFlags[]>([])
  const [publicEducation, setPublicEducation] = useState<PublicEducationFlags[]>([])
  const [publicProjects, setPublicProjects] = useState<PublicProjectFlags[]>([])

  const previousBasicsSnapshotRef = useRef({
    basicsName,
    basicsHeadline,
    basicsEmail,
    basicsMobile,
    basicsLocation,
    basicsSummary,
    basicsPhotoAlt,
    publicBasics,
  })
  const previousLinksRef = useRef(links)
  const previousPublicLinksRef = useRef(publicLinks)
  const previousCredentialsRef = useRef(credentials)
  const previousPublicCredentialsRef = useRef(publicCredentials)
  const previousExperienceRef = useRef(experience)
  const previousPublicExperienceRef = useRef(publicExperience)
  const previousEducationRef = useRef(education)
  const previousPublicEducationRef = useRef(publicEducation)
  const previousProjectsRef = useRef(projects)
  const previousPublicProjectsRef = useRef(publicProjects)
  const lastLoadedDraftSignatureRef = useRef('')
  const suppressDirtyTrackingRef = useRef(false)
  const errorBannerRef = useRef<HTMLDivElement | null>(null)
  const draftSignature = useMemo(
    () =>
      buildDraftSignature({
        basicsName,
        basicsHeadline,
        basicsEmail,
        basicsMobile,
        basicsLocation,
        basicsSummary,
        basicsPhotoAlt,
        skillsText,
        languagesText,
        links,
        credentials,
        experience,
        education,
        projects,
        publicBasics,
        publicSections,
        publicLinks,
        publicCredentials,
        publicExperience,
        publicEducation,
        publicProjects,
      }),
    [
      basicsName,
      basicsHeadline,
      basicsEmail,
      basicsMobile,
      basicsLocation,
      basicsSummary,
      basicsPhotoAlt,
      skillsText,
      languagesText,
      links,
      credentials,
      experience,
      education,
      projects,
      publicBasics,
      publicSections,
      publicLinks,
      publicCredentials,
      publicExperience,
      publicEducation,
      publicProjects,
    ],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const principal = await fetchAuthMe()
      if (cancelled) return
      setMe(principal)
      setMeLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/locales', { credentials: 'same-origin' })
        if (!res.ok) return
        const payload = (await res.json()) as unknown
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return
        const obj = payload as Record<string, unknown>
        const list = Array.isArray(obj.locales) ? obj.locales : []
        const next = list
          .filter((x): x is { locale: unknown; label?: unknown } => Boolean(x && typeof x === 'object' && !Array.isArray(x)))
          .map((x) => ({
            locale: typeof x.locale === 'string' ? x.locale.trim().toLowerCase() : '',
            label: typeof x.label === 'string' ? x.label.trim() : undefined,
          }))
          .filter((x) => Boolean(x.locale))
        if (!cancelled && next.length) setLocales(next)
      } catch {
        // Ignore; fallback to 'en'.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (suppressDirtyTrackingRef.current) {
      if (draftSignature === lastLoadedDraftSignatureRef.current) {
        suppressDirtyTrackingRef.current = false
        setIsDirty(false)
      }
      return
    }
    const nextDirty = draftSignature !== lastLoadedDraftSignatureRef.current
    setIsDirty(nextDirty)
    if (nextDirty) setStatus(null)
  }, [draftSignature])

  useEffect(() => {
    if (!isDirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    if (!status) return
    const timer = window.setTimeout(() => setStatus(null), 2500)
    return () => window.clearTimeout(timer)
  }, [status])

  useEffect(() => {
    if (!error) return
    errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    errorBannerRef.current?.focus()
  }, [error])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams()
      if (locale) qs.set('locale', locale)

      const privateRes = await fetch(`/api/manage/profile/private?${qs.toString()}`, { credentials: 'same-origin' })
      const publicRes = await fetch(`/api/manage/profile/public?${qs.toString()}`, { credentials: 'same-origin' })

      if (privateRes.status === 401 || publicRes.status === 401) {
        redirectToLogin('/admin/editor')
        return
      }

      const privateBodyResult = await readJsonResponse<{ json?: string; error?: string }>(privateRes)
      if (!privateBodyResult.ok) throw new Error(privateBodyResult.error)
      const privateBody = privateBodyResult.value
      if (!privateRes.ok) throw new Error(privateBody.error || `Request failed (${privateRes.status})`)

      const publicBodyResult = await readJsonResponse<{ json?: string; error?: string }>(publicRes)
      if (!publicBodyResult.ok) throw new Error(publicBodyResult.error)
      const publicBody = publicBodyResult.value
      if (!publicRes.ok) throw new Error(publicBody.error || `Request failed (${publicRes.status})`)

      const privateJsonText = typeof privateBody.json === 'string' ? privateBody.json : ''
      const publicJsonText = typeof publicBody.json === 'string' ? publicBody.json : ''

      const parsedPrivate = privateJsonText.trim() ? safeJsonParse<Record<string, unknown>>(privateJsonText) : { ok: true as const, value: {} }
      if (!parsedPrivate.ok) throw new Error(parsedPrivate.error)
      setRaw(parsedPrivate.value)

      const parsedPublic = publicJsonText.trim() ? safeJsonParse<Record<string, unknown>>(publicJsonText) : { ok: true as const, value: {} }
      if (!parsedPublic.ok) throw new Error(parsedPublic.error)

      suppressDirtyTrackingRef.current = true
      setStatus(null)
      const pb = asObject(parsedPublic.value.basics)
      const nextPublicBasics = {
        name: typeof pb.name === 'string' && pb.name.trim().length > 0,
        headline: typeof pb.headline === 'string' && pb.headline.trim().length > 0,
        location: typeof pb.location === 'string' && pb.location.trim().length > 0,
        summary: typeof pb.summary === 'string' && pb.summary.trim().length > 0,
        photoAlt:
          (typeof pb.photoAlt === 'string' && pb.photoAlt.trim().length > 0) ||
          (typeof pb.photoUrl === 'string' && pb.photoUrl.trim().length > 0),
      }
      const nextPublicSections = {
        skills: Array.isArray(parsedPublic.value.skills) && parsedPublic.value.skills.length > 0,
        languages: Array.isArray(parsedPublic.value.languages) && parsedPublic.value.languages.length > 0,
      }

      const publicLinksArr = asArray(parsedPublic.value.links)
      const publicLinksByKey = new Map<string, Record<string, unknown>>()
      for (const x of publicLinksArr) {
        const o = asObject(x)
        const key = `${asString(o.label).trim()}|${asString(o.url).trim()}`
        if (key !== '|') publicLinksByKey.set(key, o)
      }

      const privateLinksArr = asArray(parsedPrivate.value.links).map((x) => asObject(x))
      const nextPublicLinks = privateLinksArr.map((o) => {
          const key = `${asString(o.label).trim()}|${asString(o.url).trim()}`
          const pub = publicLinksByKey.get(key) ?? null
          if (!pub) return { label: false, url: false }
          return {
            label: typeof pub.label === 'string' && asString(pub.label).trim().length > 0,
            url: typeof pub.url === 'string' && asString(pub.url).trim().length > 0,
          }
        })

      const publicCredArr = asArray(parsedPublic.value.credentials)
      const publicCredByExactKey = new Map<string, Record<string, unknown>>()
      const publicCredByIssuerLabelKey = new Map<string, Record<string, unknown>>()
      for (const x of publicCredArr) {
        const o = asObject(x)
        const issuer = asString(o.issuer).trim()
        const label = asString(o.label).trim()
        const url = asString(o.url).trim()
        const exactKey = `${issuer}|${label}|${url}`
        if (exactKey !== '||') publicCredByExactKey.set(exactKey, o)
        const issuerLabelKey = `${issuer}|${label}`
        if (issuerLabelKey !== '|') publicCredByIssuerLabelKey.set(issuerLabelKey, o)
      }
      const privateCredArr = asArray(parsedPrivate.value.credentials).map((x) => asObject(x))
      const nextPublicCredentials = privateCredArr.map((o) => {
          const issuer = asString(o.issuer).trim()
          const label = asString(o.label).trim()
          const url = asString(o.url).trim()
          const exactKey = `${issuer}|${label}|${url}`
          const issuerLabelKey = `${issuer}|${label}`
          const pub = publicCredByExactKey.get(exactKey) ?? publicCredByIssuerLabelKey.get(issuerLabelKey) ?? null
          if (!pub) return { issuer: false, label: false, url: false }
          return {
            issuer: typeof pub.issuer === 'string' && asString(pub.issuer).trim().length > 0,
            label: typeof pub.label === 'string' && asString(pub.label).trim().length > 0,
            url: typeof pub.url === 'string' && asString(pub.url).trim().length > 0,
          }
        })

      const publicExpArr = asArray(parsedPublic.value.experience)
      const publicExpByKey = new Map<string, Record<string, unknown>>()
      for (const x of publicExpArr) {
        const o = asObject(x)
        const key = `${asString(o.company).trim()}|${asString(o.role).trim()}|${asString(o.start).trim()}|${asString(o.end).trim()}`
        if (key !== '|||') publicExpByKey.set(key, o)
      }
      const privateExpArr = asArray(parsedPrivate.value.experience).map((x) => asObject(x))
      const nextPublicExperience = privateExpArr.map((o) => {
          const key = `${asString(o.company).trim()}|${asString(o.role).trim()}|${asString(o.start).trim()}|${asString(o.end).trim()}`
          const pub = publicExpByKey.get(key) ?? null
          if (!pub)
            return {
              company: false,
              links: false,
              role: false,
              start: false,
              end: false,
              location: false,
              skills: false,
              highlights: false,
            }
          return {
            company: typeof pub.company === 'string' && asString(pub.company).trim().length > 0,
            links: Array.isArray(pub.links) && pub.links.length > 0,
            role: typeof pub.role === 'string' && asString(pub.role).trim().length > 0,
            start: typeof pub.start === 'string' && asString(pub.start).trim().length > 0,
            end: typeof pub.end === 'string' && asString(pub.end).trim().length > 0,
            location: typeof pub.location === 'string' && asString(pub.location).trim().length > 0,
            skills: Array.isArray(pub.skills) && pub.skills.length > 0,
            highlights: Array.isArray(pub.highlights) && pub.highlights.length > 0,
          }
        })

      const publicEduArr = asArray(parsedPublic.value.education)
      const publicEduByKey = new Map<string, Record<string, unknown>>()
      for (const x of publicEduArr) {
        const o = asObject(x)
        const key = `${asString(o.school).trim()}|${asString(o.program).trim()}|${asString(o.start).trim()}|${asString(o.end).trim()}`
        if (key !== '|||') publicEduByKey.set(key, o)
      }
      const privateEduArr = asArray(parsedPrivate.value.education).map((x) => asObject(x))
      const nextPublicEducation = privateEduArr.map((o) => {
          const key = `${asString(o.school).trim()}|${asString(o.program).trim()}|${asString(o.start).trim()}|${asString(o.end).trim()}`
          const pub = publicEduByKey.get(key) ?? null
          if (!pub)
            return {
              school: false,
              schoolUrl: false,
              degree: false,
              field: false,
              program: false,
              start: false,
              end: false,
              location: false,
              highlights: false,
            }
          return {
            school: typeof pub.school === 'string' && asString(pub.school).trim().length > 0,
            schoolUrl: typeof pub.schoolUrl === 'string' && asString(pub.schoolUrl).trim().length > 0,
            degree: typeof pub.degree === 'string' && asString(pub.degree).trim().length > 0,
            field: typeof pub.field === 'string' && asString(pub.field).trim().length > 0,
            program: typeof pub.program === 'string' && asString(pub.program).trim().length > 0,
            start: typeof pub.start === 'string' && asString(pub.start).trim().length > 0,
            end: typeof pub.end === 'string' && asString(pub.end).trim().length > 0,
            location: typeof pub.location === 'string' && asString(pub.location).trim().length > 0,
            highlights: Array.isArray(pub.highlights) && pub.highlights.length > 0,
          }
        })

      const publicProjArr = asArray(parsedPublic.value.projects)
      const publicProjByKey = new Map<string, Record<string, unknown>>()
      for (const x of publicProjArr) {
        const o = asObject(x)
        const key = asString(o.name).trim()
        if (key) publicProjByKey.set(key, o)
      }
      const privateProjArr = asArray(parsedPrivate.value.projects).map((x) => asObject(x))
      const nextPublicProjects = privateProjArr.map((o) => {
          const key = asString(o.name).trim()
          const pub = (key ? publicProjByKey.get(key) : null) ?? null
          if (!pub) return { name: false, tags: false, description: false }
          return {
            name: typeof pub.name === 'string' && asString(pub.name).trim().length > 0,
            tags: Array.isArray(pub.tags) && pub.tags.length > 0,
            description: typeof pub.description === 'string' && asString(pub.description).trim().length > 0,
          }
        })

      const basics = asObject(parsedPrivate.value.basics)
      const nextBasicsName = asString(basics.name)
      const nextBasicsHeadline = asString(basics.headline)
      const nextBasicsEmail = asString(basics.email)
      const nextBasicsMobile = asString(basics.mobile)
      const nextBasicsLocation = asString(basics.location)
      const nextBasicsSummary = asString(basics.summary)
      const nextBasicsPhotoAlt = asString(basics.photoAlt)
      const nextSkillsText = stringArrayToTextAreaLines(asStringArray(parsedPrivate.value.skills))
      const nextLanguagesText = stringArrayToTextAreaLines(asStringArray(parsedPrivate.value.languages))
      const nextLinks = asArray(parsedPrivate.value.links).map((x) => {
        const o = asObject(x)
        return { label: asString(o.label), url: asString(o.url) }
      })
      const nextCredentials = asArray(parsedPrivate.value.credentials).map((x) => {
        const o = asObject(x)
        return {
          issuer: asString(o.issuer),
          label: asString(o.label),
          url: asString(o.url),
          dateEarned: asString(o.dateEarned) || undefined,
          dateExpires: asString(o.dateExpires) || undefined,
        }
      })
      const nextExperience = asArray(parsedPrivate.value.experience).map((x) => {
        const o = asObject(x)
        return {
          company: asString(o.company),
          links: normalizeExperienceLinks(o.links),
          role: asString(o.role),
          start: asString(o.start),
          end: asString(o.end),
          location: asString(o.location) || undefined,
          skills: asStringArray(o.skills),
          highlights: asStringArray(o.highlights),
        }
      })
      const nextEducation = asArray(parsedPrivate.value.education).map((x) => {
        const o = asObject(x)
        return {
          school: asString(o.school),
          schoolUrl: asString(o.schoolUrl) || undefined,
          degree: asString(o.degree) || undefined,
          field: asString(o.field) || undefined,
          program: asString(o.program) || undefined,
          start: asString(o.start) || undefined,
          end: asString(o.end) || undefined,
          location: asString(o.location) || undefined,
          gpa: asString(o.gpa) || undefined,
          highlights: asStringArray(o.highlights),
        }
      })
      const nextProjects = asArray(parsedPrivate.value.projects).map((x) => {
        const o = asObject(x)
        return {
          name: asString(o.name),
          description: asString(o.description),
          tags: asStringArray(o.tags),
          links: asArray(o.links).map((l) => {
            const lo = asObject(l)
            return { label: asString(lo.label), url: asString(lo.url) }
          }),
        }
      })

      lastLoadedDraftSignatureRef.current = buildDraftSignature({
        basicsName: nextBasicsName,
        basicsHeadline: nextBasicsHeadline,
        basicsEmail: nextBasicsEmail,
        basicsMobile: nextBasicsMobile,
        basicsLocation: nextBasicsLocation,
        basicsSummary: nextBasicsSummary,
        basicsPhotoAlt: nextBasicsPhotoAlt,
        skillsText: nextSkillsText,
        languagesText: nextLanguagesText,
        links: nextLinks,
        credentials: nextCredentials,
        experience: nextExperience,
        education: nextEducation,
        projects: nextProjects,
        publicBasics: nextPublicBasics,
        publicSections: nextPublicSections,
        publicLinks: nextPublicLinks,
        publicCredentials: nextPublicCredentials,
        publicExperience: nextPublicExperience,
        publicEducation: nextPublicEducation,
        publicProjects: nextPublicProjects,
      })

      setPublicBasics(nextPublicBasics)
      setPublicSections(nextPublicSections)
      setPublicLinks(nextPublicLinks)
      setPublicCredentials(nextPublicCredentials)
      setPublicExperience(nextPublicExperience)
      setPublicEducation(nextPublicEducation)
      setPublicProjects(nextPublicProjects)
      setBasicsName(nextBasicsName)
      setBasicsHeadline(nextBasicsHeadline)
      setBasicsEmail(nextBasicsEmail)
      setBasicsMobile(nextBasicsMobile)
      setBasicsLocation(nextBasicsLocation)
      setBasicsSummary(nextBasicsSummary)
      setBasicsPhotoAlt(nextBasicsPhotoAlt)
      setSkillsText(nextSkillsText)
      setLanguagesText(nextLanguagesText)
      setLinks(nextLinks)
      setCredentials(nextCredentials)
      setExperience(nextExperience)
      setEducation(nextEducation)
      setProjects(nextProjects)
      setPublicValidation(emptyPublicValidation())
      setHasLoadedOnce(true)
    } catch (e: unknown) {
      suppressDirtyTrackingRef.current = false
      setError(toErrorMessage(e, 'Failed loading profile.'))
    } finally {
      setHasLoadedOnce(true)
      setLoading(false)
    }
  }

  function handleLocaleChange(nextLocale: string) {
    if (nextLocale === locale) return
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Switch locale and discard them?')
      if (!confirmed) return
    }
    setLocale(nextLocale)
  }

  useEffect(() => {
    if (!meLoading && isAdmin) {
      void load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meLoading, isAdmin, locale])

  useEffect(() => {
    const prev = previousBasicsSnapshotRef.current
    setPublicValidation((cur) => {
      if (Object.keys(cur.basics).length === 0) return cur
      const nextBasics = { ...cur.basics }
      let changed = false

      if ((prev.basicsName !== basicsName || prev.publicBasics.name !== publicBasics.name) && nextBasics.name) {
        delete nextBasics.name
        changed = true
      }
      if ((prev.basicsHeadline !== basicsHeadline || prev.publicBasics.headline !== publicBasics.headline) && nextBasics.headline) {
        delete nextBasics.headline
        changed = true
      }
      if ((prev.basicsLocation !== basicsLocation || prev.publicBasics.location !== publicBasics.location) && nextBasics.location) {
        delete nextBasics.location
        changed = true
      }
      if ((prev.basicsSummary !== basicsSummary || prev.publicBasics.summary !== publicBasics.summary) && nextBasics.summary) {
        delete nextBasics.summary
        changed = true
      }
      if ((prev.basicsPhotoAlt !== basicsPhotoAlt || prev.publicBasics.photoAlt !== publicBasics.photoAlt) && nextBasics.photoAlt) {
        delete nextBasics.photoAlt
        changed = true
      }

      return changed ? { ...cur, basics: nextBasics } : cur
    })

    previousBasicsSnapshotRef.current = {
      basicsName,
      basicsHeadline,
      basicsEmail,
      basicsMobile,
      basicsLocation,
      basicsSummary,
      basicsPhotoAlt,
      publicBasics,
    }
  }, [basicsName, basicsHeadline, basicsEmail, basicsMobile, basicsLocation, basicsSummary, basicsPhotoAlt, publicBasics])

  useEffect(() => {
    setPublicValidation((cur) => {
      const nextErrors = clearChangedRowErrors({
        previousRows: previousLinksRef.current,
        nextRows: links,
        previousFlags: previousPublicLinksRef.current,
        nextFlags: publicLinks,
        currentErrors: cur.links,
      })
      return nextErrors ? { ...cur, links: nextErrors } : cur
    })
    previousLinksRef.current = links
    previousPublicLinksRef.current = publicLinks
  }, [links, publicLinks])

  useEffect(() => {
    setPublicValidation((cur) => {
      const nextErrors = clearChangedRowErrors({
        previousRows: previousCredentialsRef.current,
        nextRows: credentials,
        previousFlags: previousPublicCredentialsRef.current,
        nextFlags: publicCredentials,
        currentErrors: cur.credentials,
      })
      return nextErrors ? { ...cur, credentials: nextErrors } : cur
    })
    previousCredentialsRef.current = credentials
    previousPublicCredentialsRef.current = publicCredentials
  }, [credentials, publicCredentials])

  useEffect(() => {
    setPublicValidation((cur) => {
      const nextErrors = clearChangedRowErrors({
        previousRows: previousExperienceRef.current,
        nextRows: experience,
        previousFlags: previousPublicExperienceRef.current,
        nextFlags: publicExperience,
        currentErrors: cur.experience,
      })
      return nextErrors ? { ...cur, experience: nextErrors } : cur
    })
    previousExperienceRef.current = experience
    previousPublicExperienceRef.current = publicExperience
  }, [experience, publicExperience])

  useEffect(() => {
    setPublicValidation((cur) => {
      const nextErrors = clearChangedRowErrors({
        previousRows: previousEducationRef.current,
        nextRows: education,
        previousFlags: previousPublicEducationRef.current,
        nextFlags: publicEducation,
        currentErrors: cur.education,
      })
      return nextErrors ? { ...cur, education: nextErrors } : cur
    })
    previousEducationRef.current = education
    previousPublicEducationRef.current = publicEducation
  }, [education, publicEducation])

  useEffect(() => {
    setPublicValidation((cur) => {
      const nextErrors = clearChangedRowErrors({
        previousRows: previousProjectsRef.current,
        nextRows: projects,
        previousFlags: previousPublicProjectsRef.current,
        nextFlags: publicProjects,
        currentErrors: cur.projects,
      })
      return nextErrors ? { ...cur, projects: nextErrors } : cur
    })
    previousProjectsRef.current = projects
    previousPublicProjectsRef.current = publicProjects
  }, [projects, publicProjects])

  async function save() {
    setIsSaving(true)
    setLoading(true)
    setError(null)
    setStatus(null)
    setPublicValidation(emptyPublicValidation())
    try {
      const next: Record<string, unknown> = { ...(raw ?? {}) }
      next.basics = {
        ...(asObject(next.basics) ?? {}),
        name: basicsName.trim(),
        headline: basicsHeadline.trim(),
        email: basicsEmail.trim() || undefined,
        mobile: basicsMobile.trim() || undefined,
        location: basicsLocation.trim() || undefined,
        summary: basicsSummary.trim() || undefined,
        photoAlt: basicsPhotoAlt.trim() || undefined,
      }
      next.skills = textAreaLinesToStringArray(skillsText)
      next.languages = textAreaLinesToStringArray(languagesText)
      next.links = links.filter((l) => l.label.trim() && l.url.trim())
      next.credentials = credentials.filter((c) => c.issuer.trim() && c.label.trim() && c.url.trim())
      next.experience = experience
        .filter((e) => e.company.trim() && e.role.trim())
        .map((e) => ({
          ...e,
          skills: (e.skills ?? []).filter(Boolean),
          highlights: (e.highlights ?? []).filter(Boolean),
        }))
      next.education = education
        .filter((e) => e.school.trim())
        .map((e) => ({
          ...e,
          highlights: (e.highlights ?? []).filter(Boolean),
        }))
      next.projects = projects
        .filter((p) => p.name.trim())
        .map((p) => ({
          ...p,
          tags: (p.tags ?? []).filter(Boolean),
          links: (p.links ?? []).filter((l) => l.label.trim() && l.url.trim()),
        }))

      const qs = new URLSearchParams()
      if (locale) qs.set('locale', locale)

      const privateJson = JSON.stringify(next, null, 2)

      const publicNext: Record<string, unknown> = {}
      const nextBasics = asObject(next.basics)
      const nextSkills = asStringArray(next.skills)
      const nextLanguages = asStringArray(next.languages)
      const nextValidation = emptyPublicValidation()

      if (publicBasics.name && !asString(nextBasics.name).trim()) nextValidation.basics.name = 'Name is toggled public but empty.'
      if (publicBasics.headline && !asString(nextBasics.headline).trim()) nextValidation.basics.headline = 'Headline is toggled public but empty.'
      if (publicBasics.location && !asString(nextBasics.location).trim()) nextValidation.basics.location = 'Location is toggled public but empty.'
      if (publicBasics.summary && !asString(nextBasics.summary).trim()) nextValidation.basics.summary = 'Summary is toggled public but empty.'
      if (publicBasics.photoAlt && !asString(nextBasics.photoAlt).trim()) nextValidation.basics.photoAlt = 'Photo alt is toggled public but empty.'
      if (publicSections.skills && nextSkills.length === 0) nextValidation.sections.skills = 'Skills are toggled public but empty.'
      if (publicSections.languages && nextLanguages.length === 0) nextValidation.sections.languages = 'Languages are toggled public but empty.'

      links.forEach((l, idx) => {
        const flags = publicLinks[idx]
        if (!hasAnyEnabledFlag(flags)) return
        const label = (l.label ?? '').trim()
        const url = (l.url ?? '').trim()
        if (!flags?.label || !flags?.url || !label || !url) {
          nextValidation.links[idx] = 'Public link requires label and URL, both toggled on and filled.'
        }
      })

      credentials.forEach((c, idx) => {
        const flags = publicCredentials[idx]
        if (!hasAnyEnabledFlag(flags)) return
        const issuer = (c.issuer ?? '').trim()
        const label = (c.label ?? '').trim()
        const url = (c.url ?? '').trim()
        if (!flags?.issuer || !flags?.label || !issuer || !label) {
          nextValidation.credentials[idx] = 'Public credential requires issuer and label, both toggled on and filled.'
          return
        }
        if (flags.url && !url) nextValidation.credentials[idx] = 'Credential URL is toggled public but empty.'
      })

      experience.forEach((e, idx) => {
        const flags = publicExperience[idx]
        if (!hasAnyEnabledFlag(flags)) return
        const company = (e.company ?? '').trim()
        const role = (e.role ?? '').trim()
        const start = (e.start ?? '').trim()
        if (!flags?.company || !flags?.role || !flags?.start || !company || !role || !start) {
          nextValidation.experience[idx] = 'Public experience requires company, role, and start, all toggled on and filled.'
          return
        }
        const rowIssues: string[] = []
        const visibleLinks = (e.links ?? []).filter((link) => (link.label ?? '').trim() && (link.url ?? '').trim())
        if (flags.links && visibleLinks.length === 0) rowIssues.push('Links are toggled public but empty.')
        if (flags.end && !(e.end ?? '').trim()) rowIssues.push('End is toggled public but empty.')
        if (flags.location && !(e.location ?? '').trim()) rowIssues.push('Location is toggled public but empty.')
        if (flags.skills && !(e.skills ?? []).length) rowIssues.push('Skills are toggled public but empty.')
        if (flags.highlights && !(e.highlights ?? []).length) rowIssues.push('Highlights are toggled public but empty.')
        if (rowIssues.length) nextValidation.experience[idx] = rowIssues.join(' ')
      })

      education.forEach((e, idx) => {
        const flags = publicEducation[idx]
        if (!hasAnyEnabledFlag(flags)) return
        const school = (e.school ?? '').trim()
        if (!flags?.school || !school) {
          nextValidation.education[idx] = 'Public education requires school toggled on and filled.'
          return
        }
        const rowIssues: string[] = []
        if (flags.schoolUrl && !(e.schoolUrl ?? '').trim()) rowIssues.push('School URL is toggled public but empty.')
        if (flags.degree && !(e.degree ?? '').trim()) rowIssues.push('Degree is toggled public but empty.')
        if (flags.field && !(e.field ?? '').trim()) rowIssues.push('Field is toggled public but empty.')
        if (flags.program && !(e.program ?? '').trim()) rowIssues.push('Program is toggled public but empty.')
        if (flags.start && !(e.start ?? '').trim()) rowIssues.push('Start is toggled public but empty.')
        if (flags.end && !(e.end ?? '').trim()) rowIssues.push('End is toggled public but empty.')
        if (flags.location && !(e.location ?? '').trim()) rowIssues.push('Location is toggled public but empty.')
        if (flags.highlights && !(e.highlights ?? []).length) rowIssues.push('Highlights are toggled public but empty.')
        if (rowIssues.length) nextValidation.education[idx] = rowIssues.join(' ')
      })

      projects.forEach((p, idx) => {
        const flags = publicProjects[idx]
        if (!hasAnyEnabledFlag(flags)) return
        const name = (p.name ?? '').trim()
        if (!flags?.name || !name) {
          nextValidation.projects[idx] = 'Public project requires name toggled on and filled.'
          return
        }
        const rowIssues: string[] = []
        if (flags.description && !(p.description ?? '').trim()) rowIssues.push('Description is toggled public but empty.')
        if (flags.tags && !(p.tags ?? []).length) rowIssues.push('Tags are toggled public but empty.')
        if (rowIssues.length) nextValidation.projects[idx] = rowIssues.join(' ')
      })

      if (hasPublicValidationErrors(nextValidation)) {
        setPublicValidation(nextValidation)
        setError('Fix the highlighted public visibility issues before saving.')
        queueMicrotask(() => focusFirstValidationIssue(nextValidation))
        return
      }

      const publicBasicsObj: Record<string, unknown> = {}
      if (publicBasics.name) publicBasicsObj.name = asString(nextBasics.name)
      if (publicBasics.headline) publicBasicsObj.headline = asString(nextBasics.headline)
      if (publicBasics.location && asString(nextBasics.location).trim()) publicBasicsObj.location = asString(nextBasics.location).trim()
      if (publicBasics.summary && asString(nextBasics.summary).trim()) publicBasicsObj.summary = asString(nextBasics.summary).trim()
      if (publicBasics.photoAlt && asString(nextBasics.photoAlt).trim()) publicBasicsObj.photoAlt = asString(nextBasics.photoAlt).trim()
      if (publicBasics.photoAlt && asString(nextBasics.photoUrl).trim()) publicBasicsObj.photoUrl = asString(nextBasics.photoUrl).trim()
      if (Object.keys(publicBasicsObj).length) publicNext.basics = publicBasicsObj

      if (publicSections.skills) publicNext.skills = nextSkills
      if (publicSections.languages) publicNext.languages = nextLanguages

      const publicLinksOut = links
        .map((l, idx) => {
          const flags = publicLinks[idx]
          if (!flags?.label || !flags?.url) return null
          const label = (l.label ?? '').trim()
          const url = (l.url ?? '').trim()
          if (!label || !url) return null
          return { label, url }
        })
        .filter(Boolean)
      if (publicLinksOut.length) publicNext.links = publicLinksOut

      const publicCredOut = credentials
        .map((c, idx) => {
          const flags = publicCredentials[idx]
          if (!hasAnyEnabledFlag(flags)) return null
          const issuer = (c.issuer ?? '').trim()
          const label = (c.label ?? '').trim()
          const url = (c.url ?? '').trim()
          if (!flags?.issuer || !flags?.label || !issuer || !label) return null
          if (flags.url && !url) return null
          return flags.url && url ? { issuer, label, url } : { issuer, label }
        })
        .filter(Boolean)
      if (publicCredOut.length) publicNext.credentials = publicCredOut

      const publicExpOut = experience
        .map((e, idx) => {
          const flags = publicExperience[idx]
          if (!flags) return null
          if (!flags.company || !flags.role || !flags.start) return null
          const company = (e.company ?? '').trim()
          const role = (e.role ?? '').trim()
          const start = (e.start ?? '').trim()
          if (!company || !role || !start) return null
          const out: Record<string, unknown> = { company, role, start }
          if (flags.end && (e.end ?? '').trim()) out.end = (e.end ?? '').trim()
          if (flags.location && (e.location ?? '').trim()) out.location = (e.location ?? '').trim()
          if (flags.links) {
            const links = (e.links ?? [])
              .map((link) => ({ label: (link.label ?? '').trim(), url: (link.url ?? '').trim() }))
              .filter((link) => link.label && link.url)
            if (links.length) out.links = links
          }
          if (flags.skills && (e.skills ?? []).length) out.skills = (e.skills ?? []).filter(Boolean)
          if (flags.highlights && (e.highlights ?? []).length) out.highlights = (e.highlights ?? []).filter(Boolean)
          return out
        })
        .filter(Boolean)
      if (publicExpOut.length) publicNext.experience = publicExpOut

      const publicEduOut = education
        .map((e, idx) => {
          const flags = publicEducation[idx]
          if (!flags) return null
          if (!flags.school) return null
          const school = (e.school ?? '').trim()
          if (!school) return null
          const out: Record<string, unknown> = { school }
          if (flags.program && (e.program ?? '').trim()) out.program = (e.program ?? '').trim()
          if (flags.schoolUrl && (e.schoolUrl ?? '').trim()) out.schoolUrl = (e.schoolUrl ?? '').trim()
          if (flags.degree && (e.degree ?? '').trim()) out.degree = (e.degree ?? '').trim()
          if (flags.field && (e.field ?? '').trim()) out.field = (e.field ?? '').trim()
          if (flags.start && (e.start ?? '').trim()) out.start = (e.start ?? '').trim()
          if (flags.end && (e.end ?? '').trim()) out.end = (e.end ?? '').trim()
          if (flags.location && (e.location ?? '').trim()) out.location = (e.location ?? '').trim()
          if (flags.highlights && (e.highlights ?? []).length) out.highlights = (e.highlights ?? []).filter(Boolean)
          return out
        })
        .filter(Boolean)
      if (publicEduOut.length) publicNext.education = publicEduOut

      const publicProjOut = projects
        .map((p, idx) => {
          const flags = publicProjects[idx]
          if (!flags?.name) return null
          const name = (p.name ?? '').trim()
          if (!name) return null
          const out: Record<string, unknown> = { name }
          if (flags.description && (p.description ?? '').trim()) out.description = (p.description ?? '').trim()
          if (flags.tags && (p.tags ?? []).length) out.tags = (p.tags ?? []).filter(Boolean)
          return out
        })
        .filter(Boolean)
      if (publicProjOut.length) publicNext.projects = publicProjOut

      const publicJson = JSON.stringify(publicNext, null, 2)

      const put = async (which: 'private' | 'public', json: string) => {
        const res = await fetch(`/api/manage/profile/${which}?${qs.toString()}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json', accept: 'application/json', 'x-cv-admin': '1' },
          credentials: 'same-origin',
          body: JSON.stringify({ json }),
        })
        if (res.status === 401) {
          redirectToLogin('/admin/editor')
          return { ok: false as const }
        }
        const bodyResult = await readJsonResponse<{ ok?: boolean; error?: string }>(res)
        if (!bodyResult.ok) throw new Error(bodyResult.error)
        const body = bodyResult.value
        if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
        return { ok: true as const }
      }

      const privatePut = await put('private', privateJson)
      if (!privatePut.ok) return
      const publicPut = await put('public', publicJson)
      if (!publicPut.ok) return

      await load()
      setIsDirty(false)
      setPublicValidation(emptyPublicValidation())
      setStatus('Profile saved.')
    } catch (e: unknown) {
      setError(toErrorMessage(e, 'Failed saving profile.'))
    } finally {
      setIsSaving(false)
      setLoading(false)
    }
  }

  if (meLoading) {
    return (
      <div className="w-full space-y-4 py-10">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Checking admin session…
        </div>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="w-full space-y-6 py-10">
        <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Shield className="h-5 w-5" />
            <div className="text-lg font-semibold">Admin editor</div>
          </div>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            Sign in with Entra ID to edit your profile.
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              href="/.auth/login/aad"
            >
              <KeyRound className="h-4 w-4" /> Sign in <ExternalLink className="h-4 w-4 opacity-80" />
            </a>
            <Link className="text-xs font-medium text-slate-600 underline underline-offset-4 dark:text-slate-300" to="/">
              Back to site
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="w-full space-y-6 py-10">
        <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Shield className="h-5 w-5" />
            <div className="text-lg font-semibold">Admin editor</div>
          </div>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            Signed in as <span className="font-mono">{me.userDetails ?? 'unknown'}</span>, but you don’t have the{' '}
            <span className="font-mono">admin</span> role yet.
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/20 dark:text-slate-300">
            In Azure Portal → Static Web App → Role assignments: add role <span className="font-mono">admin</span> to the
            identity you see in <span className="font-mono">/.auth/me</span>.
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              href="/.auth/me"
              target="_blank"
              rel="noreferrer"
            >
              Open `/.auth/me` <ExternalLink className="h-4 w-4 opacity-80" />
            </a>
            <a className="text-xs font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" href="/.auth/logout">
              Sign out
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 pb-28 pt-10 md:pb-10">
      <AdminEditorHeader
        locale={locale}
        locales={locales}
        setLocale={handleLocaleChange}
        hasUnsavedChanges={isDirty}
        loading={loading}
        saving={isSaving}
        signedInEmail={me.userDetails}
        onSave={() => void save()}
      />

      {error ? (
        <div
          ref={errorBannerRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 outline-none dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </div>
      ) : null}
      {status ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {status}
        </div>
      ) : null}
      {isSaving ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
        >
          <span className="inline-flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Saving profile...
          </span>
        </div>
      ) : null}
      {loading && !hasLoadedOnce ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
        >
          <span className="inline-flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Loading profile editor…
          </span>
        </div>
      ) : null}

      {!hasLoadedOnce ? null : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <BasicsSection
              basicsName={basicsName}
              setBasicsName={setBasicsName}
              basicsHeadline={basicsHeadline}
              setBasicsHeadline={setBasicsHeadline}
              basicsEmail={basicsEmail}
              setBasicsEmail={setBasicsEmail}
              basicsMobile={basicsMobile}
              setBasicsMobile={setBasicsMobile}
              basicsLocation={basicsLocation}
              setBasicsLocation={setBasicsLocation}
              basicsSummary={basicsSummary}
              setBasicsSummary={setBasicsSummary}
              basicsPhotoAlt={basicsPhotoAlt}
              setBasicsPhotoAlt={setBasicsPhotoAlt}
              publicBasics={publicBasics}
              setPublicBasics={setPublicBasics}
              publicBasicsErrors={publicValidation.basics}
            />

            <SkillsLanguagesSection
              skillsText={skillsText}
              setSkillsText={setSkillsText}
              languagesText={languagesText}
              setLanguagesText={setLanguagesText}
              publicSections={publicSections}
              setPublicSections={setPublicSections}
              sectionErrors={publicValidation.sections}
            />
          </div>

          <LinksSection
            links={links}
            setLinks={setLinks}
            publicLinks={publicLinks}
            setPublicLinks={setPublicLinks}
            isMobile={isMobile}
            rowErrors={publicValidation.links}
          />

          <CredentialsSection
            credentials={credentials}
            setCredentials={setCredentials}
            publicCredentials={publicCredentials}
            setPublicCredentials={setPublicCredentials}
            isMobile={isMobile}
            rowErrors={publicValidation.credentials}
          />

          <ExperienceSection
            experience={experience}
            setExperience={setExperience}
            publicExperience={publicExperience}
            setPublicExperience={setPublicExperience}
            isMobile={isMobile}
            rowErrors={publicValidation.experience}
          />

          <EducationSection
            education={education}
            setEducation={setEducation}
            publicEducation={publicEducation}
            setPublicEducation={setPublicEducation}
            isMobile={isMobile}
            rowErrors={publicValidation.education}
          />

          <ProjectsSection
            projects={projects}
            setProjects={setProjects}
            publicProjects={publicProjects}
            setPublicProjects={setPublicProjects}
            isMobile={isMobile}
            rowErrors={publicValidation.projects}
          />
        </>
      )}

      {hasLoadedOnce ? (
        <>
          <div className="fixed bottom-6 right-6 z-40 hidden md:block">
            <button
              type="button"
              disabled={loading || isSaving}
              onClick={() => void save()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : <Save className="h-4 w-4 shrink-0" />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
            <button
              type="button"
              disabled={loading || isSaving}
              onClick={() => void save()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : <Save className="h-4 w-4 shrink-0" />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}

