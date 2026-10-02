import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { useAppView } from '../lib/appView'
import { useIsPageLoading } from '../lib/pageLoading'
import { useI18n } from '../lib/i18n'
import { SiteFooter } from '../components/SiteFooter'
import { useCustomFavicon } from '../lib/favicon'
import { useSiteBranding } from '../lib/siteBrandingContext'
import { useThemeOrDefault } from '../lib/themeContext'

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
  const isAdminBranding = pathname === '/admin/branding'
  const isCompactAdmin = isAdminDashboard || isAdminShare || isAdminBranding
  const contentMaxClass = isPdfExport
    ? 'max-w-6xl'
    : isAdminEditor
      ? 'max-w-[96rem]'
      : isCompactAdmin
        ? 'max-w-6xl'
        : view === 'landing'
          ? 'max-w-3xl'
          : 'max-w-5xl'
  const { branding } = useSiteBranding()
  const theme = useThemeOrDefault()
  useCustomFavicon()

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
        <SiteFooter
          brandmark={branding.brandmark}
          theme={theme}
          className={`relative mx-auto w-full px-4 pb-6 sm:px-6 lg:px-8 ${contentMaxClass}`}
        />
      )}

      <ScrollRestoration />
    </div>
  )
}
