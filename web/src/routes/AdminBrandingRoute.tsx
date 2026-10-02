import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, Check, Info, Moon, Palette, Trash2, Upload } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { LanguageSelector } from '../components/LanguageSelector'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { SiteFooter } from '../components/SiteFooter'
import { ThemeToggle } from '../components/ThemeToggle'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { cn } from '../components/ui/cn'
import { fetchAuthMe, extractEmailFromPrincipal, readJsonOrNull, type ClientPrincipal } from '../lib/adminAuth'
import { redirectToLogin } from '../lib/authRedirect'
import { getBrand } from '../lib/brand'
import { faviconHrefFromName } from '../lib/favicon'
import { useI18n } from '../lib/i18n'
import { useLoadingIndicator } from '../lib/loadingIndicator'
import {
  BRANDMARK_IMAGE_TYPES,
  FAVICON_TYPES,
  MAX_BRANDMARK_HTML_CHARS,
  MAX_BRANDMARK_IMAGE_BYTES,
  MAX_FAVICON_BYTES,
  dataUrlByteLength,
  dataUrlMimeType,
  parseSiteBranding,
  type SiteBranding,
} from '../lib/siteBranding'
import { useSiteBranding } from '../lib/siteBrandingContext'
import type { MessageKey } from '../i18n/messages'
import type { ThemePreference } from '../lib/theme'
import { useTheme } from '../lib/themeContext'
import { AdminPageHeader } from './AdminPageHeader'

type MarkType = 'none' | 'image' | 'html'

/** Everything the form edits. Switching the mark type keeps the other type's fields, so it is undoable. */
type Draft = {
  faviconMode: 'initials' | 'custom'
  favicon: string
  markType: MarkType
  imageSrc: string
  imageSrcDark: string
  imageAlt: string
  imageHref: string
  html: string
  htmlDark: string
}

function draftFromBranding(branding: SiteBranding): Draft {
  const mark = branding.brandmark
  return {
    faviconMode: branding.favicon ? 'custom' : 'initials',
    favicon: branding.favicon ?? '',
    markType: mark?.type ?? 'none',
    imageSrc: mark?.type === 'image' ? mark.src : '',
    imageSrcDark: mark?.type === 'image' ? (mark.srcDark ?? '') : '',
    imageAlt: mark?.type === 'image' ? (mark.alt ?? '') : '',
    imageHref: mark?.type === 'image' ? (mark.href ?? '') : '',
    html: mark?.type === 'html' ? mark.html : '',
    htmlDark: mark?.type === 'html' ? (mark.htmlDark ?? '') : '',
  }
}

/** The document the draft would save. Incomplete parts are left out, so the preview never breaks. */
function brandingFromDraft(draft: Draft): SiteBranding {
  const branding: SiteBranding = {}
  if (draft.faviconMode === 'custom' && draft.favicon) branding.favicon = draft.favicon

  if (draft.markType === 'image' && draft.imageSrc) {
    branding.brandmark = {
      type: 'image',
      src: draft.imageSrc,
      ...(draft.imageSrcDark ? { srcDark: draft.imageSrcDark } : {}),
      ...(draft.imageAlt.trim() ? { alt: draft.imageAlt.trim() } : {}),
      ...(draft.imageHref.trim() ? { href: draft.imageHref.trim() } : {}),
    }
  } else if (draft.markType === 'html' && draft.html.trim()) {
    branding.brandmark = {
      type: 'html',
      html: draft.html.trim(),
      ...(draft.htmlDark.trim() ? { htmlDark: draft.htmlDark.trim() } : {}),
    }
  }
  return branding
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

type DraftErrors = Partial<Record<'favicon' | 'image' | 'href' | 'html' | 'htmlDark', string>>

function validateDraft(draft: Draft, t: (key: MessageKey) => string): DraftErrors {
  const errors: DraftErrors = {}
  if (draft.faviconMode === 'custom' && !draft.favicon) errors.favicon = t('adminBrandingFaviconRequired')
  if (draft.markType === 'image') {
    if (!draft.imageSrc) errors.image = t('adminBrandingImageRequired')
    if (draft.imageHref.trim() && !isHttpUrl(draft.imageHref.trim())) errors.href = t('adminBrandingLinkInvalid')
  }
  if (draft.markType === 'html') {
    if (!draft.html.trim()) errors.html = t('adminBrandingHtmlRequired')
    else if (draft.html.length > MAX_BRANDMARK_HTML_CHARS) errors.html = t('adminBrandingHtmlTooLong')
    if (draft.htmlDark.length > MAX_BRANDMARK_HTML_CHARS) errors.htmlDark = t('adminBrandingHtmlTooLong')
  }
  return errors
}

const MIME_LABELS: Record<string, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/svg+xml': 'SVG',
  'image/x-icon': 'ICO',
  'image/vnd.microsoft.icon': 'ICO',
}

function describeAsset(dataUrl: string) {
  const bytes = dataUrlByteLength(dataUrl)
  const size = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
  return `${MIME_LABELS[dataUrlMimeType(dataUrl)] ?? 'Image'} · ${size}`
}

/** `.ico` files often arrive with an empty or generic MIME type, so the extension is the fallback. */
function resolveMimeType(file: File) {
  const type = file.type.toLowerCase()
  if (type && type !== 'application/octet-stream') return type
  if (/\.ico$/i.test(file.name)) return 'image/x-icon'
  if (/\.svg$/i.test(file.name)) return 'image/svg+xml'
  return type
}

async function readFileAsDataUrl(file: File, mimeType: string): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return `data:${mimeType};base64,${btoa(binary)}`
}

/** A button that opens a file picker; the input stays out of sight and out of the tab order. */
function FileButton({
  accept,
  label,
  onFile,
  size = 'sm',
}: {
  accept: string
  label: string
  onFile: (file: File) => void
  size?: 'sm' | 'md'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <Button size={size} iconLeft={<Upload className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />} onClick={() => inputRef.current?.click()}>
        {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Reset so picking the same file again still fires.
          event.target.value = ''
          if (file) onFile(file)
        }}
      />
    </>
  )
}

/** Pill-shaped switch between a few options. Each option is a toggle button. */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex gap-0.5 rounded-field border border-line bg-surface-sunken p-0.5">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'vc-focusable h-8 rounded-[0.5rem] px-3.5 text-xs font-semibold',
              active ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} className="text-xs text-critical-soft-ink">
      {children}
    </p>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="vc-focusable inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-field border border-critical/25 bg-surface text-critical hover:bg-critical-soft"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  )
}

/** One of the light/dark brandmark image slots, shown on the background it will sit on. */
function ImageSlot({
  title,
  optional,
  theme,
  src,
  onFile,
  onRemove,
  removeLabel,
}: {
  title: string
  optional?: string
  theme: ThemePreference
  src: string
  onFile: (file: File) => void
  onRemove: () => void
  removeLabel: string
}) {
  const { t } = useI18n()
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-sm font-semibold text-ink">
        {title}
        {optional ? <span className="font-normal text-ink-subtle"> · {optional}</span> : null}
      </span>
      <div
        className={cn(
          `vc-theme-${theme}`,
          'flex h-28 items-center justify-center rounded-field border border-line bg-canvas p-3',
        )}
      >
        {src ? (
          <img src={src} alt="" className="block h-auto max-h-20 w-auto max-w-full" />
        ) : (
          <span className="text-xs text-ink-subtle">—</span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-ink-subtle">{src ? describeAsset(src) : ''}</span>
        <span className="flex gap-1.5">
          <FileButton
            accept={BRANDMARK_IMAGE_TYPES.join(',')}
            label={src ? t('adminBrandingReplace') : t('adminBrandingUpload')}
            onFile={onFile}
          />
          {src ? <RemoveButton label={removeLabel} onClick={onRemove} /> : null}
        </span>
      </div>
    </div>
  )
}

function OptionCard({
  active,
  onClick,
  icon,
  title,
  hint,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  title: string
  hint: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'vc-focusable flex items-center gap-3 rounded-field border p-3.5 text-left',
        active ? 'border-accent bg-accent-soft ring-1 ring-accent' : 'border-line bg-surface hover:border-line-strong',
      )}
    >
      <span className="inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-[0.45rem]" aria-hidden="true">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span className="text-xs text-ink-subtle">{hint}</span>
      </span>
    </button>
  )
}

export function AdminBrandingRoute() {
  const { t } = useI18n()
  const { theme } = useTheme()
  const { setBranding } = useSiteBranding()
  const [me, setMe] = useState<ClientPrincipal | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const isAdmin = useMemo(() => (me?.userRoles ?? []).includes('admin'), [me])

  const [saved, setSaved] = useState<SiteBranding | null>(null)
  const [draft, setDraft] = useState<Draft>(() => draftFromBranding({}))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedNotice, setSavedNotice] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [fileErrors, setFileErrors] = useState<Partial<Record<'favicon' | 'image', string>>>({})
  const [showDarkHtml, setShowDarkHtml] = useState(false)
  const [previewTheme, setPreviewTheme] = useState<ThemePreference>(theme)

  const ids = { favicon: useId(), image: useId(), href: useId(), html: useId(), htmlDark: useId(), alt: useId() }

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
    if (!isAdmin) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/manage/branding', {
          credentials: 'same-origin',
          headers: { accept: 'application/json', 'x-cv-admin': '1' },
        })
        if (res.status === 401) {
          redirectToLogin('/admin/branding')
          return
        }
        if (!res.ok) throw new Error()
        const branding = parseSiteBranding(await readJsonOrNull(res))
        if (cancelled) return
        setSaved(branding)
        setDraft(draftFromBranding(branding))
        setShowDarkHtml(branding.brandmark?.type === 'html' && Boolean(branding.brandmark.htmlDark))
      } catch {
        if (!cancelled) setLoadError(t('adminBrandingLoadFailed'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAdmin, t])

  const draftBranding = useMemo(() => brandingFromDraft(draft), [draft])
  const isDirty = useMemo(
    () => saved !== null && JSON.stringify(draft) !== JSON.stringify(draftFromBranding(saved)),
    [draft, saved],
  )
  const errors = useMemo(() => validateDraft(draft, t), [draft, t])
  const visibleErrors: DraftErrors = showErrors ? errors : {}

  const publicName = (import.meta.env.VITE_PUBLIC_NAME as string | undefined)?.trim() || getBrand().name
  const initialsFavicon = useMemo(() => faviconHrefFromName(publicName), [publicName])

  const update = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setSavedNotice(false)
  }

  async function acceptFile(
    file: File,
    slot: 'favicon' | 'image',
    allowed: string[],
    maxBytes: number,
    apply: (dataUrl: string) => void,
  ) {
    const mimeType = resolveMimeType(file)
    if (!allowed.includes(mimeType)) {
      setFileErrors((current) => ({ ...current, [slot]: t('adminBrandingFileTypeError') }))
      return
    }
    if (file.size > maxBytes) {
      setFileErrors((current) => ({
        ...current,
        [slot]: t('adminBrandingFileSizeError').replace('{max}', String(maxBytes / 1024)),
      }))
      return
    }
    setFileErrors((current) => ({ ...current, [slot]: undefined }))
    apply(await readFileAsDataUrl(file, mimeType))
  }

  async function save() {
    setShowErrors(true)
    if (Object.keys(errors).length > 0) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/manage/branding', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json', 'x-cv-admin': '1' },
        body: JSON.stringify(draftBranding),
      })
      if (res.status === 401) {
        redirectToLogin('/admin/branding')
        return
      }
      const body = await readJsonOrNull<{ error?: string }>(res)
      if (!res.ok) throw new Error(body?.error || t('adminBrandingSaveFailed'))
      const next = parseSiteBranding(body)
      setSaved(next)
      setDraft(draftFromBranding(next))
      setBranding(next)
      setShowErrors(false)
      setSavedNotice(true)
    } catch (e: unknown) {
      setSaveError(e instanceof Error && e.message ? e.message : t('adminBrandingSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  function discard() {
    if (!saved) return
    setDraft(draftFromBranding(saved))
    setShowErrors(false)
    setFileErrors({})
    setSaveError(null)
  }

  useEffect(() => {
    if (!meLoading && !me) redirectToLogin('/admin/branding')
  }, [me, meLoading])

  const showSessionLoader = useLoadingIndicator(meLoading || (isAdmin && saved === null && !loadError))

  if (meLoading) {
    return showSessionLoader ? <LoadingSpinner label={t('adminSessionChecking')} className="py-10" /> : null
  }
  if (!me) return null
  // The dashboard explains a missing admin role.
  if (!isAdmin) return <Navigate to="/admin" replace />

  const markTypeOptions: { value: MarkType; label: string }[] = [
    { value: 'none', label: t('adminBrandingMarkNone') },
    { value: 'image', label: t('adminBrandingMarkImage') },
    { value: 'html', label: t('adminBrandingMarkHtml') },
  ]
  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: t('adminBrandingLightTheme') },
    { value: 'dark', label: t('adminBrandingDarkTheme') },
  ]
  const faviconError = fileErrors.favicon ?? visibleErrors.favicon
  const imageError = fileErrors.image ?? visibleErrors.image

  return (
    <div className="w-full space-y-6 py-2">
      <div className="space-y-3">
        <Link
          to="/admin"
          className="vc-focusable inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('adminPortal')}
        </Link>
        <AdminPageHeader
          title={t('adminBranding')}
          icon={<Palette className="h-5 w-5 text-ink-subtle" aria-hidden="true" />}
          signedInEmail={extractEmailFromPrincipal(me)}
          actions={
            <>
              <LanguageSelector />
              <ThemeToggle />
              <Button
                size="sm"
                onClick={() => {
                  window.location.href = '/.auth/logout'
                }}
              >
                {t('adminSignOut')}
              </Button>
            </>
          }
        />
        <p className="max-w-2xl text-sm text-ink-muted">{t('adminBrandingIntro')}</p>
      </div>

      {loadError ? (
        <p role="alert" className="rounded-field border border-critical/25 bg-critical-soft px-4 py-3 text-sm text-critical-soft-ink">
          {loadError}
        </p>
      ) : null}

      {saved === null ? (
        showSessionLoader && !loadError ? <LoadingSpinner label={t('adminWorking')} className="py-10" /> : null
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-5">
            {/* Browser tab icon */}
            <Card as="section" aria-labelledby={`${ids.favicon}-title`} className="space-y-4">
              <div>
                <h2 id={`${ids.favicon}-title`} className="text-base font-semibold text-ink">
                  {t('adminBrandingFaviconTitle')}
                </h2>
                <p className="mt-1 text-sm text-ink-subtle">{t('adminBrandingFaviconDescription')}</p>
              </div>

              <div role="group" aria-label={t('adminBrandingFaviconSource')} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <OptionCard
                  active={draft.faviconMode === 'initials'}
                  onClick={() => update({ faviconMode: 'initials' })}
                  icon={<img src={initialsFavicon} alt="" className="h-full w-full" />}
                  title={t('adminBrandingFaviconInitials')}
                  hint={t('adminBrandingFaviconInitialsHint')}
                />
                <OptionCard
                  active={draft.faviconMode === 'custom'}
                  onClick={() => update({ faviconMode: 'custom' })}
                  icon={
                    draft.favicon ? (
                      <img src={draft.favicon} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center border border-dashed border-line-strong text-ink-subtle">
                        <Upload className="h-3.5 w-3.5" />
                      </span>
                    )
                  }
                  title={t('adminBrandingFaviconCustom')}
                  hint={t('adminBrandingFaviconCustomHint')}
                />
              </div>

              {draft.faviconMode === 'custom' ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-4 rounded-field border border-line bg-surface-muted p-3.5">
                    {draft.favicon ? (
                      <div className="flex items-end gap-2.5" aria-hidden="true">
                        <img src={draft.favicon} alt="" className="block h-12 w-12 rounded-lg" />
                        <img src={draft.favicon} alt="" className="block h-8 w-8 rounded-md" />
                        <img src={draft.favicon} alt="" className="block h-4 w-4 rounded-[3px]" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1 text-xs text-ink-subtle">
                      {draft.favicon ? describeAsset(draft.favicon) : t('adminBrandingFaviconRequirements')}
                    </div>
                    <div className="flex gap-1.5">
                      <FileButton
                        accept={[...FAVICON_TYPES, '.ico'].join(',')}
                        label={draft.favicon ? t('adminBrandingReplace') : t('adminBrandingUpload')}
                        onFile={(file) =>
                          void acceptFile(file, 'favicon', FAVICON_TYPES, MAX_FAVICON_BYTES, (favicon) => update({ favicon }))
                        }
                      />
                      {draft.favicon ? (
                        <RemoveButton label={t('adminBrandingRemoveFavicon')} onClick={() => update({ favicon: '' })} />
                      ) : null}
                    </div>
                  </div>
                  {draft.favicon ? <p className="text-xs text-ink-subtle">{t('adminBrandingFaviconRequirements')}</p> : null}
                  <FieldError>{faviconError}</FieldError>
                </div>
              ) : null}
            </Card>

            {/* Footer brandmark */}
            <Card as="section" aria-labelledby={`${ids.image}-title`} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id={`${ids.image}-title`} className="text-base font-semibold text-ink">
                    {t('adminBrandingMarkTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-ink-subtle">{t('adminBrandingMarkDescription')}</p>
                </div>
                <Segmented
                  label={t('adminBrandingMarkType')}
                  value={draft.markType}
                  options={markTypeOptions}
                  onChange={(markType) => update({ markType })}
                />
              </div>

              {draft.markType === 'none' ? (
                <p className="rounded-field border border-dashed border-line-strong p-6 text-center text-sm text-ink-subtle">
                  {t('adminBrandingMarkNoneHint')}
                </p>
              ) : null}

              {draft.markType === 'image' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ImageSlot
                      title={t('adminBrandingLightTheme')}
                      theme="light"
                      src={draft.imageSrc}
                      removeLabel={t('adminBrandingRemoveLightImage')}
                      onRemove={() => update({ imageSrc: '' })}
                      onFile={(file) =>
                        void acceptFile(file, 'image', BRANDMARK_IMAGE_TYPES, MAX_BRANDMARK_IMAGE_BYTES, (imageSrc) =>
                          update({ imageSrc }),
                        )
                      }
                    />
                    <ImageSlot
                      title={t('adminBrandingDarkTheme')}
                      optional={t('adminBrandingOptional')}
                      theme="dark"
                      src={draft.imageSrcDark}
                      removeLabel={t('adminBrandingRemoveDarkImage')}
                      onRemove={() => update({ imageSrcDark: '' })}
                      onFile={(file) =>
                        void acceptFile(file, 'image', BRANDMARK_IMAGE_TYPES, MAX_BRANDMARK_IMAGE_BYTES, (imageSrcDark) =>
                          update({ imageSrcDark }),
                        )
                      }
                    />
                  </div>
                  <p className="text-xs text-ink-subtle">{t('adminBrandingImageRequirements')}</p>
                  <FieldError>{imageError}</FieldError>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={ids.alt} className="text-sm font-semibold text-ink">
                        {t('adminBrandingAltText')}
                      </label>
                      <input
                        id={ids.alt}
                        type="text"
                        className="vc-field"
                        maxLength={200}
                        value={draft.imageAlt}
                        onChange={(event) => update({ imageAlt: event.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={ids.href} className="text-sm font-semibold text-ink">
                        {t('adminBrandingLink')} <span className="text-xs font-normal text-ink-subtle">· {t('adminBrandingLinkHint')}</span>
                      </label>
                      <input
                        id={ids.href}
                        type="url"
                        inputMode="url"
                        placeholder="https://"
                        className="vc-field"
                        value={draft.imageHref}
                        aria-invalid={visibleErrors.href ? true : undefined}
                        aria-describedby={visibleErrors.href ? `${ids.href}-error` : undefined}
                        onChange={(event) => update({ imageHref: event.target.value })}
                      />
                      <FieldError id={`${ids.href}-error`}>{visibleErrors.href}</FieldError>
                    </div>
                  </div>
                </div>
              ) : null}

              {draft.markType === 'html' ? (
                <div className="space-y-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={ids.html} className="text-sm font-semibold text-ink">
                      {t('adminBrandingHtmlSnippet')}
                    </label>
                    <textarea
                      id={ids.html}
                      rows={7}
                      spellCheck={false}
                      className="vc-field resize-y bg-surface-muted font-mono text-xs leading-relaxed"
                      value={draft.html}
                      placeholder='<a href="https://…"><svg …>…</svg></a>'
                      aria-invalid={visibleErrors.html ? true : undefined}
                      aria-describedby={visibleErrors.html ? `${ids.html}-error` : undefined}
                      onChange={(event) => update({ html: event.target.value })}
                    />
                    <FieldError id={`${ids.html}-error`}>{visibleErrors.html}</FieldError>
                  </div>

                  {showDarkHtml ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor={ids.htmlDark} className="text-sm font-semibold text-ink">
                          {t('adminBrandingDarkSnippet')}
                        </label>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-critical hover:text-critical"
                          onClick={() => {
                            update({ htmlDark: '' })
                            setShowDarkHtml(false)
                          }}
                        >
                          {t('adminBrandingRemove')}
                        </Button>
                      </div>
                      <textarea
                        id={ids.htmlDark}
                        rows={5}
                        spellCheck={false}
                        className="vc-field resize-y bg-surface-muted font-mono text-xs leading-relaxed"
                        value={draft.htmlDark}
                        onChange={(event) => update({ htmlDark: event.target.value })}
                      />
                      <FieldError>{visibleErrors.htmlDark}</FieldError>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDarkHtml(true)}
                      className="vc-focusable inline-flex h-9 items-center gap-1.5 rounded-field border border-dashed border-line-strong bg-surface px-3 text-sm font-semibold text-accent-soft-ink hover:border-accent"
                    >
                      <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('adminBrandingAddDarkSnippet')}
                    </button>
                  )}

                  <div className="flex gap-2.5 rounded-field bg-accent-soft px-3.5 py-3 text-xs leading-relaxed text-accent-soft-ink">
                    <Info className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t('adminBrandingHtmlNote')}</span>
                  </div>
                </div>
              ) : null}
            </Card>
          </div>

          {/* Live preview */}
          <aside aria-labelledby={`${ids.favicon}-preview`} className="flex flex-col gap-3 lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-3">
              <h2 id={`${ids.favicon}-preview`} className="vc-eyebrow">
                {t('adminBrandingPreview')}
              </h2>
              <Segmented label={t('adminBrandingPreviewTheme')} value={previewTheme} options={themeOptions} onChange={setPreviewTheme} />
            </div>
            <div className={cn(`vc-theme-${previewTheme}`, 'overflow-hidden rounded-card border border-line text-ink')}>
              <div className="flex bg-surface-sunken px-2 pt-2">
                <div className="flex w-52 min-w-0 items-center gap-2 rounded-t-lg bg-canvas px-3 py-2">
                  <img src={draftBranding.favicon ?? initialsFavicon} alt="" className="block h-4 w-4 shrink-0 rounded-[3px]" />
                  <span className="truncate text-xs">{publicName}</span>
                </div>
              </div>
              <div className="bg-canvas">
                <div className="mx-4 h-14 rounded-b-card border border-t-0 border-line bg-surface" aria-hidden="true" />
                <SiteFooter brandmark={draftBranding.brandmark} theme={previewTheme} className="px-4 pb-5" />
              </div>
            </div>
            <p className="text-xs text-ink-subtle">{t('adminBrandingPreviewNote')}</p>
          </aside>
        </div>
      )}

      {saved !== null && (isDirty || saveError || savedNotice) ? (
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-surface/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="status" aria-live="polite" className="text-sm font-medium">
              {saveError ? (
                <span className="text-critical-soft-ink">{saveError}</span>
              ) : isDirty ? (
                <span className="inline-flex items-center gap-2 text-caution-soft-ink">
                  <span className="h-2 w-2 rounded-full bg-caution" aria-hidden="true" />
                  {t('adminBrandingUnsaved')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-positive-soft-ink">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  {t('adminBrandingSaved')}
                </span>
              )}
            </div>
            {isDirty ? (
              <div className="flex gap-2">
                <Button onClick={discard} disabled={saving}>
                  {t('adminBrandingDiscard')}
                </Button>
                <Button variant="primary" busy={saving} iconLeft={<Check className="h-4 w-4" aria-hidden="true" />} onClick={() => void save()}>
                  {t('adminBrandingSave')}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
