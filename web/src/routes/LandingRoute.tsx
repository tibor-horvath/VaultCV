import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Award,
  BriefcaseBusiness,
  GraduationCap,
  Languages,
  LayoutGrid,
  LibraryBig,
  ShieldCheck,
  TentTree,
} from 'lucide-react'
import { AwardsList } from '../components/cv/AwardsList'
import { BasicsCard } from '../components/cv/BasicsCard'
import { EducationList } from '../components/cv/EducationList'
import { ExperienceList } from '../components/cv/ExperienceList'
import { ProjectsGrid } from '../components/cv/ProjectsGrid'
import { SkillsChips } from '../components/cv/SkillsChips'
import { GroupedCredentials } from '../components/cv/GroupedCredentials'
import { Section } from '../components/cv/Section'
import { fetchPublicCvProfile } from '../lib/publicProfile'
import { useDocumentFavicon } from '../lib/favicon'
import { useAppView } from '../lib/appView'
import { useI18n } from '../lib/i18n'
import { LanguageSelector } from '../components/LanguageSelector'
import { CvLoadingScreen } from '../components/CvLoadingScreen'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useLoadingIndicator } from '../lib/loadingIndicator'
import { ThemeToggle } from '../components/ThemeToggle'
import { AccessCard } from '../components/AccessCard'
import { setStoredAccessCode } from '../lib/accessSession'
import { fetchCv } from '../lib/api'
import { fetchProfileScopedLocales } from '../lib/profileLocaleAvailability'
import type { CvData } from '../types/cv'
import { normalizeSectionOrder } from '../lib/sectionOrder'

const EMPTY_LOCALES: readonly string[] = []

function getPublicText(value: string | undefined, fallback: string) {
  const normalized = value?.trim()
  return normalized ? normalized : fallback
}

function sanitizePublicBasicsForLanding(input: CvData['basics'] | undefined): CvData['basics'] {
  if (!input) return { name: '', headline: '' }
  return {
    ...input,
    // Always private in public landing mode.
    email: undefined,
    mobile: undefined,
  }
}

export function LandingRoute() {
  const { locale, t } = useI18n()
  const { openCv, lockReason } = useAppView()
  const [params, setSearchParams] = useSearchParams()
  const urlShare = params.get('s') ?? ''
  const initialUrlAccess = urlShare.trim()
  const [shareLinkAccessLoading, setShareLinkAccessLoading] = useState(() => Boolean(initialUrlAccess))
  const urlTokenValidating = shareLinkAccessLoading
  const setUrlTokenValidating = setShareLinkAccessLoading
  const [sessionProbePending, setSessionProbePending] = useState(() => !initialUrlAccess)
  const [availablePublicLocales, setAvailablePublicLocales] = useState<string[] | null>(null)
  const [publicCv, setPublicCv] = useState<Partial<CvData>>(() => ({
    basics: { name: '', headline: '' },
  }))
  const [publicLoading, setPublicLoading] = useState(true)
  useEffect(() => {
    let cancelled = false

    async function loadPublicData() {
      const payload = await fetchPublicCvProfile(locale)
      if (cancelled) return
      setPublicCv(payload)

      if (!cancelled) setPublicLoading(false)
    }

    loadPublicData()
    return () => {
      cancelled = true
    }
  }, [locale])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const locales = await fetchProfileScopedLocales('public')
      if (cancelled) return
      setAvailablePublicLocales(locales)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const publicName = getPublicText(import.meta.env.VITE_PUBLIC_NAME as string | undefined, publicCv.basics?.name ?? 'CV')

  useEffect(() => {
    document.title = publicName
  }, [publicName])

  useDocumentFavicon(publicName)

  useEffect(() => {
    const trimmed = initialUrlAccess
    queueMicrotask(() => {
      if (trimmed) {
        setUrlTokenValidating(true)
        setSessionProbePending(false)
      } else {
        setUrlTokenValidating(false)
      }
    })
  }, [initialUrlAccess])

  useEffect(() => {
    const trimmed = initialUrlAccess
    if (!trimmed) return

    // IMPORTANT: do not "pre-validate" by calling `/api/auth` here.
    // `CvRoute` exchanges the token; doing it here too doubles share-link view counts.
    setStoredAccessCode(trimmed)
    // Remove the share ID from the URL so it cannot be accidentally reshared.
    setSearchParams({}, { replace: true })
    openCv()
  }, [initialUrlAccess, openCv, setSearchParams])

  useEffect(() => {
    if (initialUrlAccess) return
    let cancelled = false
    queueMicrotask(() => {
      setSessionProbePending(true)
    })
    async function checkExistingSession() {
      const cvRes = await fetchCv('', locale)
      if (cancelled) return
      if (cvRes.ok) {
        openCv()
        return
      }
      setSessionProbePending(false)
    }
    checkExistingSession()
    return () => {
      cancelled = true
    }
  }, [initialUrlAccess, locale, openCv])

  // A warm session resolves in a few ms; without this the probe would flash a loader every visit.
  const showAccessLoader = useLoadingIndicator(urlTokenValidating || sessionProbePending)

  if (urlTokenValidating || sessionProbePending) {
    // Render nothing until the loader is due. Gating this branch on `showAccessLoader` instead
    // would fall through and flash the whole landing page for the length of the delay.
    if (!showAccessLoader) return null

    // A share link is about to open the full CV, so preview its shape. The session probe is a
    // short check that would only flash a skeleton, so it keeps the bare spinner.
    return urlTokenValidating ? (
      <CvLoadingScreen label={t('loadingCv')} />
    ) : (
      <LoadingSpinner label={t('checkingAccess')} />
    )
  }

  const basics = sanitizePublicBasicsForLanding(publicCv.basics)
  const links = publicCv.links ?? []
  const publicCredentials = (publicCv.credentials ?? []).map((credential) => ({
    ...credential,
    // Always private on public landing.
    dateEarned: undefined,
    dateExpires: undefined,
  }))
  const publicEducation = (publicCv.education ?? []).map((entry) => ({
    ...entry,
    // Always private on public landing.
    gpa: undefined,
    honors: undefined,
    thesisTitle: undefined,
    advisor: undefined,
  }))
  const showPublicPhoto = Boolean(basics.photoAlt?.trim() || basics.photoUrl?.trim())
  const orderedSections = normalizeSectionOrder(publicCv.sectionOrder)

  return (
    <div className="mx-auto w-full space-y-5">
      {/* Page chrome: who this belongs to on the left, the two global controls on the right. */}
      <div className="flex items-center justify-between gap-3">
        <p className="vc-eyebrow truncate">{publicName}</p>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSelector allowedLocales={availablePublicLocales ?? EMPTY_LOCALES} />
          <ThemeToggle />
        </div>
      </div>

      {/*
        The public profile is always on screen; the access card sits beside it from `lg` up and
        under the profile header on narrower screens, so a visitor sees whose CV it is before the
        form. The card itself says why the full CV is closed (first visit, expired, refused code).
      */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <AccessCard
          reason={lockReason ?? 'locked'}
          onSubmit={(code) => {
            setStoredAccessCode(code)
            openCv()
          }}
          className="row-start-2 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        />

        {!publicLoading ? (
          <>
            <div className="row-start-1 min-w-0 motion-safe:animate-fade-in lg:col-start-1">
              <BasicsCard basics={basics} links={links} showPhoto={showPublicPhoto} />
            </div>

            <div className="row-start-3 min-w-0 space-y-5 motion-safe:animate-fade-in lg:col-start-1 lg:row-start-2">
              {orderedSections.map((key) => {
                if (key === 'credentials' && publicCredentials.length) {
                  return (
                    <Section key="credentials" title={t('credentials')} icon={<ShieldCheck className="h-4 w-4" />}>
                      <GroupedCredentials credentials={publicCredentials} t={t} showDates={false} />
                    </Section>
                  )
                }
                if (key === 'skillsLanguages') {
                  return (
                    <div key="skillsLanguages" className="space-y-5">
                      {publicCv.skills?.length ? (
                        <Section title={t('skills')} icon={<LibraryBig className="h-4 w-4" />}>
                          <SkillsChips items={publicCv.skills} />
                        </Section>
                      ) : null}
                      {publicCv.languages?.length ? (
                        <Section title={t('languages')} icon={<Languages className="h-4 w-4" />}>
                          <SkillsChips items={publicCv.languages} />
                        </Section>
                      ) : null}
                    </div>
                  )
                }
                if (key === 'experience' && publicCv.experience?.length) {
                  return (
                    <Section key="experience" title={t('experience')} icon={<BriefcaseBusiness className="h-4 w-4" />}>
                      <ExperienceList items={publicCv.experience} />
                    </Section>
                  )
                }
                if (key === 'projects' && publicCv.projects?.length) {
                  return (
                    <Section key="projects" title={t('projects')} icon={<LayoutGrid className="h-4 w-4" />}>
                      <ProjectsGrid items={publicCv.projects} />
                    </Section>
                  )
                }
                if (key === 'education' && publicEducation.length) {
                  return (
                    <Section key="education" title={t('education')} icon={<GraduationCap className="h-4 w-4" />}>
                      <EducationList items={publicEducation} />
                    </Section>
                  )
                }
                if (key === 'hobbiesInterests' && publicCv.hobbiesInterests?.length) {
                  return (
                    <Section key="hobbiesInterests" title={t('hobbiesInterests')} icon={<TentTree className="h-4 w-4" />}>
                      <SkillsChips items={publicCv.hobbiesInterests} />
                    </Section>
                  )
                }
                if (key === 'honorsAwards' && publicCv.awards?.length) {
                  return (
                    <Section key="honorsAwards" title={t('honorsAwards')} icon={<Award className="h-4 w-4" />}>
                      <AwardsList items={publicCv.awards} />
                    </Section>
                  )
                }
                return null
              })}
            </div>
          </>
        ) : (
          <div className="row-start-1 min-w-0 lg:col-start-1 lg:row-span-2">
            <CvLoadingScreen label={t('loadingPublicPreview')} fullPage={false} />
          </div>
        )}
      </div>
    </div>
  )
}
