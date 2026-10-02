import { useId, useMemo, useState } from 'react'
import { ChevronDown, ShieldCheck } from 'lucide-react'
import { SiGithubIcon, SiLinkedinIcon } from './icons/SimpleBrandIcons'
import { getBrand } from '../lib/brand'
import { useI18n } from '../lib/i18n'
import { sanitizeBrandmarkHtml, type Brandmark as BrandmarkData } from '../lib/siteBranding'
import type { ThemePreference } from '../lib/theme'
import { cn } from './ui/cn'

/** The admin's footer mark, in the variant for the active theme (falling back to the light one). */
export function Brandmark({ brandmark, theme }: { brandmark: BrandmarkData; theme: ThemePreference }) {
  const html = brandmark.type === 'html' ? (theme === 'dark' && brandmark.htmlDark) || brandmark.html : ''
  const safeHtml = useMemo(() => (html ? sanitizeBrandmarkHtml(html) : ''), [html])

  if (brandmark.type === 'html') {
    if (!safeHtml) return null
    // Sanitized above: no scripts, handlers, styles or forms survive, and links open in a new tab.
    return (
      <div
        className="flex max-w-full justify-center overflow-hidden [&_a]:inline-block [&_a]:rounded-xl [&_img]:max-w-full [&_svg]:h-auto [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    )
  }

  const src = (theme === 'dark' && brandmark.srcDark) || brandmark.src
  const image = <img src={src} alt={brandmark.alt ?? ''} className="block h-auto max-h-16 w-auto max-w-[15rem]" />
  if (!brandmark.href) return image
  return (
    <a className="vc-focusable inline-block rounded-xl" href={brandmark.href} target="_blank" rel="noopener noreferrer">
      {image}
    </a>
  )
}

/**
 * The cookie notice as a quiet chip that states the gist, expanding to the full explanation. The
 * site sets one strictly necessary cookie, so there is nothing to consent to — only to disclose.
 */
export function CookieNotice() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const detailId = useId()
  const [before, after = ''] = t('cookieNoticeDetail').split('{cookie}')

  return (
    <div className="flex flex-col items-center gap-2.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'vc-focusable inline-flex min-h-8 items-center gap-2 rounded-full border bg-surface px-3 text-xs font-medium text-ink-muted hover:border-line-strong hover:text-ink',
          open ? 'border-line-strong' : 'border-line',
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-positive-soft-ink" aria-hidden="true" />
        <span>{t('cookieNoticeSummary')}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-ink-subtle transition-transform duration-150 motion-reduce:transition-none',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>
      <p
        id={detailId}
        hidden={!open}
        className="max-w-lg rounded-field border border-line bg-surface-muted px-4 py-3 text-xs leading-relaxed text-ink-muted"
      >
        {before}
        <code className="rounded border border-line bg-surface px-1 py-px font-mono text-2xs text-ink">cv_session</code>
        {after}
      </p>
    </div>
  )
}

export function SiteFooter({
  brandmark,
  theme,
  className,
}: {
  brandmark?: BrandmarkData
  theme: ThemePreference
  className?: string
}) {
  const { t } = useI18n()
  const brand = getBrand()
  const currentYear = new Date().getFullYear()

  return (
    <footer className={className}>
      <div className="flex flex-col items-center gap-4 pt-6 text-center">
        {brandmark ? <Brandmark brandmark={brandmark} theme={theme} /> : null}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <a
            className="vc-focusable inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink"
            href={brand.repoUrl}
            target="_blank"
            rel="noreferrer"
          >
            <SiGithubIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{brand.displayName}</span>
          </a>
          <span className="h-3 w-px bg-line" aria-hidden="true" />
          <a
            className="vc-focusable inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink"
            href={brand.linkedInUrl}
            target="_blank"
            rel="noreferrer"
          >
            <SiLinkedinIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>LinkedIn</span>
          </a>
          <span className="h-3 w-px bg-line" aria-hidden="true" />
          <p className="text-xs text-ink-subtle">
            &copy; {currentYear} {brand.copyrightName}. {t('footerRights')}
          </p>
        </div>
        <CookieNotice />
      </div>
    </footer>
  )
}
