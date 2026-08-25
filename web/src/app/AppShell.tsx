import { SiGithubIcon, SiLinkedinIcon } from '../components/icons/SimpleBrandIcons'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { useAppView } from '../lib/appView'
import { useIsPageLoading } from '../lib/pageLoading'
import { getBrand } from '../lib/brand'
import { useI18n } from '../lib/i18n'

/** Anchor the skip link jumps to, and the landmark screen readers land in. */
const MAIN_ID = 'main-content'

export function AppShell() {
  const { view } = useAppView()
  const isPageLoading = useIsPageLoading()
  const { t } = useI18n()
  const { pathname } = useLocation()
  const isPdfExport = pathname === '/cv/pdf'
  const isAdminEditor = pathname === '/admin/editor' || pathname.startsWith('/admin/editor/')
  const isAdminDashboard = pathname === '/admin'
  const isAdminShare = pathname === '/admin/share' || pathname.startsWith('/admin/share/')
  const isCompactAdmin = isAdminDashboard || isAdminShare
  const contentMaxClass = isPdfExport
    ? 'max-w-6xl'
    : isAdminEditor
      ? 'max-w-[96rem]'
      : isCompactAdmin
        ? 'max-w-6xl'
        : view === 'landing'
          ? 'max-w-3xl'
          : 'max-w-5xl'
  const currentYear = new Date().getFullYear()
  const brand = getBrand()

  return (
    <div className="relative flex min-h-dvh flex-col bg-canvas">
      {/*
        Backdrop wash. One accent hue at low opacity instead of the previous cyan + violet pair —
        it reads as depth rather than decoration, and never competes with content for attention.
        Fixed and non-scrolling so long CV pages do not drag a gradient past the reader.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60rem_32rem_at_50%_-8rem,rgb(var(--vc-accent)/0.10),transparent_70%)]"
      />

      {/*
        Parked just off the top edge and slid in on focus, rather than toggling `sr-only`: the
        toggle relies on two same-weight utilities winning a specificity race, and it loses
        silently when it does not. This is always in the tab order and always styled.
      */}
      <a
        href={`#${MAIN_ID}`}
        className="vc-focusable fixed left-4 top-4 z-50 inline-flex h-9 -translate-y-20 items-center rounded-field border border-line bg-surface px-4 text-sm font-semibold text-ink shadow-raised focus:translate-y-0"
      >
        {t('skipToContent')}
      </a>

      <main
        id={MAIN_ID}
        className={`relative mx-auto flex w-full flex-1 flex-col px-4 pb-12 pt-5 sm:px-6 sm:pt-6 lg:px-8 ${contentMaxClass}`}
      >
        <Outlet />
      </main>

      {isPdfExport || isPageLoading ? null : (
        <footer className={`relative mx-auto w-full px-4 pb-6 sm:px-6 lg:px-8 ${contentMaxClass}`}>
          <div className="flex flex-col items-center gap-3 pt-6 text-center">
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
            <p className="max-w-2xl text-2xs leading-relaxed text-ink-subtle">{t('cookieDisclosure')}</p>
          </div>
        </footer>
      )}

      <ScrollRestoration />
    </div>
  )
}
