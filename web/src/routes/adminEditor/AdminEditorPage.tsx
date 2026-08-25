import { Link } from 'react-router-dom'
import { ExternalLink, KeyRound, LoaderCircle, Save, Shield } from 'lucide-react'
import { useState } from 'react'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { useLoadingIndicator } from '../../lib/loadingIndicator'
import { AdminEditorHeader } from './AdminEditorHeader'
import { BasicsSection } from './BasicsSection'
import { CredentialsSection } from './CredentialsSection'
import { EducationSection } from './EducationSection'
import { ExperienceSection } from './ExperienceSection'
import { ProjectsSection } from './ProjectsSection'
import { HobbiesInterestsSection } from './HobbiesInterestsSection'
import { HonorsAwardsSection } from './HonorsAwardsSection'
import { SkillsLanguagesSection } from './SkillsLanguagesSection'
import { SectionOrderSidebar } from './SectionOrderSidebar'
import { SectionOrderSheet } from './SectionOrderSheet'
import type { SectionKey } from '../../lib/sectionOrder'
import type {
  AwardRow,
  CredentialRow,
  EducationRow,
  ExperienceRow,
  LinkRow,
  LocaleItem,
  ProjectRow,
  PublicBasicsFlags,
  PublicEducationFlags,
  PublicExperienceFlags,
  PublicProjectFlags,
  PublicSectionsFlags,
} from './types'

export type ClientPrincipal = {
  userDetails?: string
  userRoles?: string[]
}

export function AdminEditorPage(props: {
  t: (key: Parameters<ReturnType<typeof import('../../lib/i18n').useI18n>['t']>[0]) => string
  meLoading: boolean
  me: ClientPrincipal | null
  isAdmin: boolean

  locale: string
  locales: LocaleItem[]
  addableLocales: LocaleItem[]
  onLocaleChange: (nextLocale: string) => void
  onAddLocale: (nextLocale: string) => void
  isLocaleEnabled: boolean
  onToggleLocaleEnabled: (enabled: boolean) => void

  hasUnsavedChanges: boolean
  loading: boolean
  saving: boolean
  hasLoadedOnce: boolean
  errorBannerRef: React.RefObject<HTMLDivElement | null>
  error: string | null
  status: string | null

  basicsName: string
  setBasicsName: (v: string) => void
  basicsHeadline: string
  setBasicsHeadline: (v: string) => void
  basicsEmail: string
  setBasicsEmail: (v: string) => void
  basicsMobile: string
  setBasicsMobile: (v: string) => void
  basicsLocation: string
  setBasicsLocation: (v: string) => void
  basicsSummary: string
  setBasicsSummary: (v: string) => void
  basicsPhotoAlt: string
  setBasicsPhotoAlt: (v: string) => void
  hasProfileImage: boolean
  setHasProfileImage: (v: boolean) => void
  publicBasics: PublicBasicsFlags
  setPublicBasics: React.Dispatch<React.SetStateAction<PublicBasicsFlags>>
  publicBasicsErrors: Partial<Record<keyof PublicBasicsFlags, string>>

  skills: string[]
  setSkills: (v: string[]) => void
  languages: string[]
  setLanguages: (v: string[]) => void
  sectionOrder: SectionKey[]
  setSectionOrder: (order: SectionKey[]) => void
  publicSections: PublicSectionsFlags
  setPublicSections: React.Dispatch<React.SetStateAction<PublicSectionsFlags>>
  sectionErrors: Partial<Record<keyof PublicSectionsFlags, string>>

  links: LinkRow[]
  setLinks: (updater: (cur: LinkRow[]) => LinkRow[]) => void
  linkRowErrors?: string[]

  credentials: CredentialRow[]
  setCredentials: (updater: (cur: CredentialRow[]) => CredentialRow[]) => void
  credentialRowErrors?: string[]

  experience: ExperienceRow[]
  setExperience: (updater: (cur: ExperienceRow[]) => ExperienceRow[]) => void
  publicExperience: PublicExperienceFlags[]
  setPublicExperience: (updater: (cur: PublicExperienceFlags[]) => PublicExperienceFlags[]) => void
  experienceRowErrors?: string[]

  education: EducationRow[]
  setEducation: (updater: (cur: EducationRow[]) => EducationRow[]) => void
  publicEducation: PublicEducationFlags[]
  setPublicEducation: (updater: (cur: PublicEducationFlags[]) => PublicEducationFlags[]) => void
  educationRowErrors?: string[]

  projects: ProjectRow[]
  setProjects: (updater: (cur: ProjectRow[]) => ProjectRow[]) => void
  publicProjects: PublicProjectFlags[]
  setPublicProjects: (updater: (cur: PublicProjectFlags[]) => PublicProjectFlags[]) => void
  projectRowErrors?: string[]

  hobbiesInterests: string[]
  setHobbiesInterests: (v: string[]) => void
  awards: AwardRow[]
  setAwards: (updater: (cur: AwardRow[]) => AwardRow[]) => void
  awardRowErrors?: string[]

  isMobile: boolean
  onSave: () => void
}) {
  const [isReorderSheetOpen, setIsReorderSheetOpen] = useState(false)

  const {
    t,
    meLoading,
    me,
    isAdmin,
    locale,
    locales,
    addableLocales,
    onLocaleChange,
    onAddLocale,
    isLocaleEnabled,
    onToggleLocaleEnabled,
    hasUnsavedChanges,
    loading,
    saving,
    hasLoadedOnce,
    errorBannerRef,
    error,
    status,
    basicsName,
    setBasicsName,
    basicsHeadline,
    setBasicsHeadline,
    basicsEmail,
    setBasicsEmail,
    basicsMobile,
    setBasicsMobile,
    basicsLocation,
    setBasicsLocation,
    basicsSummary,
    setBasicsSummary,
    basicsPhotoAlt,
    setBasicsPhotoAlt,
    hasProfileImage,
    setHasProfileImage,
    publicBasics,
    setPublicBasics,
    publicBasicsErrors,
    skills,
    setSkills,
    languages,
    setLanguages,
    sectionOrder,
    setSectionOrder,
    publicSections,
    setPublicSections,
    sectionErrors,
    links,
    setLinks,
    linkRowErrors,
    credentials,
    setCredentials,
    credentialRowErrors,
    experience,
    setExperience,
    publicExperience,
    setPublicExperience,
    experienceRowErrors,
    education,
    setEducation,
    publicEducation,
    setPublicEducation,
    educationRowErrors,
    projects,
    setProjects,
    publicProjects,
    setPublicProjects,
    projectRowErrors,
    hobbiesInterests,
    setHobbiesInterests,
    awards,
    setAwards,
    awardRowErrors,
    isMobile,
    onSave,
  } = props

  function renderOrderedSection(key: SectionKey) {
    switch (key) {
      case 'skillsLanguages':
        return (
          <div key="skillsLanguages" data-section="skillsLanguages">
            <SkillsLanguagesSection
              skills={skills}
              setSkills={setSkills}
              languages={languages}
              setLanguages={setLanguages}
              publicSections={publicSections}
              setPublicSections={setPublicSections}
              sectionErrors={sectionErrors}
            />
          </div>
        )
      case 'credentials':
        return (
          <div key="credentials" data-section="credentials">
            <CredentialsSection
              credentials={credentials}
              setCredentials={setCredentials}
              isMobile={isMobile}
              rowErrors={credentialRowErrors}
            />
          </div>
        )
      case 'experience':
        return (
          <div key="experience" data-section="experience">
            <ExperienceSection
              experience={experience}
              setExperience={setExperience}
              publicExperience={publicExperience}
              setPublicExperience={setPublicExperience}
              isMobile={isMobile}
              rowErrors={experienceRowErrors}
            />
          </div>
        )
      case 'education':
        return (
          <div key="education" data-section="education">
            <EducationSection
              education={education}
              setEducation={setEducation}
              publicEducation={publicEducation}
              setPublicEducation={setPublicEducation}
              isMobile={isMobile}
              rowErrors={educationRowErrors}
            />
          </div>
        )
      case 'projects':
        return (
          <div key="projects" data-section="projects">
            <ProjectsSection
              projects={projects}
              setProjects={setProjects}
              publicProjects={publicProjects}
              setPublicProjects={setPublicProjects}
              isMobile={isMobile}
              rowErrors={projectRowErrors}
            />
          </div>
        )
      case 'hobbiesInterests':
        return (
          <div key="hobbiesInterests" data-section="hobbiesInterests">
            <HobbiesInterestsSection
              hobbiesInterests={hobbiesInterests}
              setHobbiesInterests={setHobbiesInterests}
              publicSections={publicSections}
              setPublicSections={setPublicSections}
              sectionErrors={sectionErrors}
            />
          </div>
        )
      case 'honorsAwards':
        return (
          <div key="honorsAwards" data-section="honorsAwards">
            <HonorsAwardsSection
              awards={awards}
              setAwards={setAwards}
              publicSections={publicSections}
              setPublicSections={setPublicSections}
              isMobile={isMobile}
              rowErrors={awardRowErrors}
              sectionErrors={sectionErrors}
            />
          </div>
        )
      default:
        return null
    }
  }

  const showSessionLoader = useLoadingIndicator(meLoading)

  if (meLoading) {
    // Render nothing until the loader is due, so a warm session never flashes a spinner. Falling
    // through here would flash the signed-out page instead.
    return showSessionLoader ? <LoadingSpinner label={t('adminSessionChecking')} className="py-10" /> : null
  }

  if (!me) {
    return (
      <div className="w-full space-y-6 py-10">
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2 text-ink">
            <Shield className="h-5 w-5" />
            <div className="text-lg font-semibold">{t('adminEditor')}</div>
          </div>
          <div className="mt-2 text-sm text-ink-muted">{t('adminEditorSignInHint')}</div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="vc-focusable inline-flex h-11 items-center justify-center gap-2 rounded-field bg-accent px-5 text-sm font-semibold text-accent-ink shadow-card hover:bg-accent-hover active:translate-y-px"
              href="/.auth/login/aad"
            >
              <KeyRound className="h-4 w-4" /> {t('adminSignIn')} <ExternalLink className="h-4 w-4 opacity-80" />
            </a>
            <Link className="text-xs font-medium text-ink-muted underline underline-offset-4" to="/">
              {t('adminBackToSite')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="w-full space-y-6 py-10">
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2 text-ink">
            <Shield className="h-5 w-5" />
            <div className="text-lg font-semibold">{t('adminEditor')}</div>
          </div>
          <div className="mt-2 text-sm text-ink-muted">
            {t('adminNoRole').replace('{email}', me.userDetails ?? t('adminUnknownUser'))}
          </div>
          <div className="vc-card-muted mt-4 p-4 text-xs text-ink-muted">
            {t('adminRoleAssignmentHint')}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="vc-focusable inline-flex h-11 items-center justify-center gap-2 rounded-field bg-accent px-5 text-sm font-semibold text-accent-ink shadow-card hover:bg-accent-hover active:translate-y-px"
              href="/.auth/me"
              target="_blank"
              rel="noreferrer"
            >
              {t('adminOpenAuthMe')} <ExternalLink className="h-4 w-4 opacity-80" />
            </a>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/.auth/logout'
              }}
              className="text-xs font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
            >
              {t('adminSignOut')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 pb-28 pt-8 lg:pl-52 md:pb-10">
      <AdminEditorHeader
        locale={locale}
        locales={locales}
        addableLocales={addableLocales}
        setLocale={onLocaleChange}
        onAddLocale={onAddLocale}
        isLocaleEnabled={isLocaleEnabled}
        onToggleLocaleEnabled={onToggleLocaleEnabled}
        hasUnsavedChanges={hasUnsavedChanges}
        loading={loading}
        saving={saving}
        signedInEmail={me.userDetails}
        onSave={onSave}
        onOpenReorderSheet={() => setIsReorderSheetOpen(true)}
      />

      {error ? (
        <div
          ref={errorBannerRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="rounded-field border border-critical/25 bg-critical-soft px-4 py-3 text-sm text-critical-soft-ink outline-none"
        >
          {error}
        </div>
      ) : null}
      {status ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-field border border-positive/25 bg-positive-soft px-4 py-3 text-sm text-positive-soft-ink"
        >
          {status}
        </div>
      ) : null}
      {saving ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-field border border-line bg-surface px-4 py-3 text-sm text-ink-muted"
        >
          <span className="inline-flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" /> {t('adminSavingProfile')}
          </span>
        </div>
      ) : null}
      {loading && !hasLoadedOnce ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-field border border-line bg-surface px-4 py-3 text-sm text-ink-muted"
        >
          <span className="inline-flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" /> {t('adminLoadingProfileEditor')}
          </span>
        </div>
      ) : null}

      {!hasLoadedOnce ? null : (
        <div className="space-y-6">
          <div data-section="basics" className="scroll-mt-24">
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
              hasProfileImage={hasProfileImage}
              onProfileImageChange={setHasProfileImage}
              publicBasics={publicBasics}
              setPublicBasics={setPublicBasics}
              publicBasicsErrors={publicBasicsErrors}
              links={links}
              setLinks={setLinks}
              isMobile={isMobile}
              linkRowErrors={linkRowErrors}
            />
          </div>

          {sectionOrder.map((key) => renderOrderedSection(key))}
        </div>
      )}

      {hasLoadedOnce ? (
        <>
          <div className="fixed bottom-6 right-6 z-40 hidden md:block">
            <button
              type="button"
              disabled={loading || saving}
              onClick={onSave}
              className="inline-flex items-center gap-2 rounded-card bg-accent px-4 py-3 text-sm font-semibold text-accent-ink shadow-raised ring-1 ring-line/10 transition hover:bg-accent-hover disabled:opacity-55"
            >
              {saving ? <LoaderCircle className="h-4 w-4 shrink-0 motion-safe:animate-spin" /> : <Save className="h-4 w-4 shrink-0" />}
              {saving ? t('adminSaving') : t('adminSave')}
            </button>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
            <button
              type="button"
              disabled={loading || saving}
              onClick={onSave}
              className="vc-focusable inline-flex h-11 w-full items-center justify-center gap-2 rounded-field bg-accent px-4 text-sm font-semibold text-accent-ink shadow-card hover:bg-accent-hover active:translate-y-px disabled:pointer-events-none disabled:opacity-55"
            >
              {saving ? <LoaderCircle className="h-4 w-4 shrink-0 motion-safe:animate-spin" /> : <Save className="h-4 w-4 shrink-0" />}
              {saving ? t('adminSaving') : t('adminSave')}
            </button>
          </div>
        </>
      ) : null}

      <SectionOrderSidebar sectionOrder={sectionOrder} setSectionOrder={setSectionOrder} />
      <SectionOrderSheet
        isOpen={isReorderSheetOpen}
        onClose={() => setIsReorderSheetOpen(false)}
        sectionOrder={sectionOrder}
        setSectionOrder={setSectionOrder}
      />
    </div>
  )
}

