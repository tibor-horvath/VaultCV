import { SiGithubIcon, SiLinkedinIcon } from '../components/icons/SimpleBrandIcons'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { useAppView } from '../lib/appView'
import { getBrand } from '../lib/brand'
import { useI18n } from '../lib/i18n'

export function AppShell() {
  const { view } = useAppView()
  const { t } = useI18n()
  const { pathname } = useLocation()
  const isPdfExport = pathname === '/cv/pdf'
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')
  const contentMaxClass = isPdfExport ? 'max-w-6xl' : isAdmin ? 'max-w-[96rem]' : view === 'landing' ? 'max-w-3xl' : 'max-w-6xl'
  const currentYear = new Date().getFullYear()
  const brand = getBrand()

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[radial-gradient(90rem_55rem_at_15%_-10%,rgba(56,189,248,0.12),transparent),radial-gradient(70rem_42rem_at_95%_5%,rgba(139,92,246,0.14),transparent),linear-gradient(to_bottom_right,#f8fbff,#f2f6fd_45%,#eef3ff)] dark:bg-[radial-gradient(80rem_48rem_at_10%_-5%,rgba(56,189,248,0.08),transparent),radial-gradient(70rem_44rem_at_100%_0%,rgba(139,92,246,0.09),transparent),linear-gradient(to_bottom_right,#020617,#060b16_45%,#090f1f)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.07)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)]" />

      <main
        className={`relative mx-auto flex w-full flex-1 flex-col px-4 pb-14 pt-6 sm:px-6 lg:px-8 ${contentMaxClass}`}
      >
        <Outlet />
      </main>

      {isPdfExport ? null : (
      <footer className={`relative mx-auto w-full px-4 pb-6 sm:px-6 lg:px-8 ${contentMaxClass}`}>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-4 text-center text-sm text-slate-600 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.55)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/35 dark:text-slate-300">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700/80 dark:bg-slate-950/75 dark:text-slate-200 dark:hover:bg-slate-900"
              href={brand.repoUrl}
              target="_blank"
              rel="noreferrer"
            >
              <SiGithubIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{brand.name}</span>
            </a>
            <a
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700/80 dark:bg-slate-950/75 dark:text-slate-200 dark:hover:bg-slate-900"
              href={brand.linkedInUrl}
              target="_blank"
              rel="noreferrer"
            >
              <SiLinkedinIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>LinkedIn</span>
            </a>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            &copy; {currentYear} {brand.copyrightName}. {t('footerRights')}
          </p>
          <p className="max-w-3xl text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{t('cookieDisclosure')}</p>
        </div>
      </footer>
      )}

      <ScrollRestoration />
    </div>
  )
}

