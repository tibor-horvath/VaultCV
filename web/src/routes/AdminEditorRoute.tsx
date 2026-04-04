import { useEffect, useMemo, useState } from 'react'
import { AdminEditorPage, type ClientPrincipal } from './adminEditor/AdminEditorPage'
import { useI18n } from '../lib/i18n'
import { mergeRowErrors } from './adminEditor/editorRouteUtils'
import { useAdminEditorProfile } from './adminEditor/useAdminEditorProfile'

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

export function AdminEditorRoute() {
  const { locale: uiLocale, t } = useI18n()
  const [me, setMe] = useState<ClientPrincipal | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const isAdmin = useMemo(() => (me?.userRoles ?? []).includes('admin'), [me])

  const editor = useAdminEditorProfile({ t, uiLocale, isAdmin, meLoading })

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

  return (
    <AdminEditorPage
      t={t}
      meLoading={meLoading}
      me={me}
      isAdmin={isAdmin}
      locale={editor.locale}
      locales={editor.locales}
      addableLocales={editor.addableLocales}
      onLocaleChange={editor.handleLocaleChange}
      onAddLocale={editor.handleAddLocale}
      hasUnsavedChanges={editor.isDirty}
      loading={editor.loading}
      saving={editor.isSaving}
      hasLoadedOnce={editor.hasLoadedOnce}
      errorBannerRef={editor.errorBannerRef}
      error={editor.error}
      status={editor.status}
      basicsName={editor.basicsName}
      setBasicsName={editor.setBasicsName}
      basicsHeadline={editor.basicsHeadline}
      setBasicsHeadline={editor.setBasicsHeadline}
      basicsEmail={editor.basicsEmail}
      setBasicsEmail={editor.setBasicsEmail}
      basicsMobile={editor.basicsMobile}
      setBasicsMobile={editor.setBasicsMobile}
      basicsLocation={editor.basicsLocation}
      setBasicsLocation={editor.setBasicsLocation}
      basicsSummary={editor.basicsSummary}
      setBasicsSummary={editor.setBasicsSummary}
      basicsPhotoAlt={editor.basicsPhotoAlt}
      setBasicsPhotoAlt={editor.setBasicsPhotoAlt}
      hasProfileImage={editor.hasProfileImage}
      setHasProfileImage={editor.setHasProfileImage}
      publicBasics={editor.publicBasics}
      setPublicBasics={editor.setPublicBasics}
      publicBasicsErrors={editor.publicValidation.basics}
      skills={editor.skills}
      setSkills={editor.setSkills}
      languages={editor.languages}
      setLanguages={editor.setLanguages}
      sectionOrder={editor.sectionOrder}
      setSectionOrder={editor.setSectionOrder}
      publicSections={editor.publicSections}
      setPublicSections={editor.setPublicSections}
      sectionErrors={editor.publicValidation.sections}
      links={editor.links}
      setLinks={editor.setLinks}
      linkRowErrors={mergeRowErrors(editor.publicValidation.links, editor.privateValidation.links)}
      credentials={editor.credentials}
      setCredentials={editor.setCredentials}
      credentialRowErrors={mergeRowErrors(editor.publicValidation.credentials, editor.privateValidation.credentials)}
      experience={editor.experience}
      setExperience={editor.setExperience}
      publicExperience={editor.publicExperience}
      setPublicExperience={editor.setPublicExperience}
      experienceRowErrors={mergeRowErrors(editor.publicValidation.experience, editor.privateValidation.experience)}
      education={editor.education}
      setEducation={editor.setEducation}
      publicEducation={editor.publicEducation}
      setPublicEducation={editor.setPublicEducation}
      educationRowErrors={mergeRowErrors(editor.publicValidation.education, editor.privateValidation.education)}
      projects={editor.projects}
      setProjects={editor.setProjects}
      publicProjects={editor.publicProjects}
      setPublicProjects={editor.setPublicProjects}
      projectRowErrors={mergeRowErrors(editor.publicValidation.projects, editor.privateValidation.projects)}
      isMobile={editor.isMobile}
      onSave={() => void editor.save()}
    />
  )
}

