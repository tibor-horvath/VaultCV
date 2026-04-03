import { Link } from 'react-router-dom'
import { ExternalLink, KeyRound, LoaderCircle, Save, Shield } from 'lucide-react'
import { useState } from 'react'
import { AdminEditorHeader } from './AdminEditorHeader'
import { BasicsSection } from './BasicsSection'
import { CredentialsSection } from './CredentialsSection'
import { EducationSection } from './EducationSection'
import { ExperienceSection } from './ExperienceSection'
import { LinksSection } from './LinksSection'
import { ProjectsSection } from './ProjectsSection'
import { SkillsLanguagesSection } from './SkillsLanguagesSection'
import { SectionOrderSidebar } from './SectionOrderSidebar'
import { SectionOrderSheet } from './SectionOrderSheet'
import type { SectionKey } from '../../lib/sectionOrder'
import type {
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
      case 'links':
        return (
          <div key="links" data-section="links">
            <LinksSection links={links} setLinks={setLinks} isMobile={isMobile} rowErrors={linkRowErrors} />
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
    }
  }

  if (meLoading) {
    return (
      <div className="w-full space-y-4 py-10">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <LoaderCircle className="h-4 w-4 animate-spin" /> {t('adminSessionChecking')}
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
            <div className="text-lg font-semibold">{t('adminEditor')}</div>
          </div>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">{t('adminEditorSignInHint')}</div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              href="/.auth/login/aad"
            >
              <KeyRound className="h-4 w-4" /> {t('adminSignIn')} <ExternalLink className="h-4 w-4 opacity-80" />
            </a>
            <Link className="text-xs font-medium text-slate-600 underline underline-offset-4 dark:text-slate-300" to="/">
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
        <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Shield className="h-5 w-5" />
            <div className="text-lg font-semibold">{t('adminEditor')}</div>
          </div>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {t('adminNoRole').replace('{email}', me.userDetails ?? t('adminUnknownUser'))}
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/20 dark:text-slate-300">
            {t('adminRoleAssignmentHint')}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
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
              className="text-xs font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
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
      {saving ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
        >
          <span className="inline-flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 animate-spin" /> {t('adminSavingProfile')}
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
            <LoaderCircle className="h-4 w-4 animate-spin" /> {t('adminLoadingProfileEditor')}
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
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:ring-white/20"
            >
              {saving ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : <Save className="h-4 w-4 shrink-0" />}
              {saving ? t('adminSaving') : t('adminSave')}
            </button>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
            <button
              type="button"
              disabled={loading || saving}
              onClick={onSave}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {saving ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : <Save className="h-4 w-4 shrink-0" />}
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

