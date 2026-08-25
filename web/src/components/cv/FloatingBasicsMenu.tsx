import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { CvBasics, CvLink } from '../../types/cv'
import { Mail } from 'lucide-react'
import { SiGithubIcon, SiLinkedinIcon } from '../icons/SimpleBrandIcons'
import { buildPhotoSrc, inferLinkKind, parseBasicsHeadline } from '../../lib/cvPresentation'
import { useI18n } from '../../lib/i18n'
import { cn } from '../ui/cn'

const iconLinkClass =
  'vc-focusable inline-flex h-7 w-7 items-center justify-center rounded-field text-ink-subtle hover:bg-surface-muted hover:text-ink'

/**
 * The bar that takes over from the profile card once it scrolls away: who this CV belongs to, plus
 * the actions worth keeping within reach the whole way down.
 *
 * Full-bleed rather than the previous centred pill — at a glance it reads as page chrome instead
 * of a floating notification, and it has room for actions on wide screens without crowding the
 * name on narrow ones.
 *
 * Rendered through a portal onto `<body>`. `position: fixed` resolves against the nearest ancestor
 * that establishes a containing block, and *any* ancestor carrying a `transform`, `filter`,
 * `backdrop-filter`, `perspective`, `contain` or `will-change` does so — including, as measured,
 * the CV's own `animate-fade-in` wrapper while its transform animation is live. Under the route
 * tree the bar was laid out against the content column instead of the viewport. From `<body>`
 * there is nothing above it that can capture it.
 */
export function FloatingBasicsMenu({
  basics,
  links,
  profilePhotoSrc,
  actions,
  visible = true,
}: {
  basics: CvBasics
  links?: CvLink[]
  profilePhotoSrc?: string
  /** Quick actions shown to the left of the social links (e.g. PDF download). */
  actions?: ReactNode
  visible?: boolean
}) {
  const { t } = useI18n()
  const photoSrc = profilePhotoSrc ?? buildPhotoSrc(basics)
  const { role } = parseBasicsHeadline(basics.headline)
  const visibleLinks = (links ?? []).filter((l) => inferLinkKind(l) !== 'other')
  const github = visibleLinks.find((l) => inferLinkKind(l) === 'github')
  const linkedin = visibleLinks.find((l) => inferLinkKind(l) === 'linkedin')

  const bar = (
    <div
      aria-hidden={!visible}
      data-testid="floating-basics-menu"
      className={cn(
        'fixed inset-x-0 top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md',
        'transition-[opacity,transform] duration-200 ease-emphasis motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0',
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Matches the shell's content column so the bar lines up with the cards underneath. */}
      <div className="mx-auto flex h-[var(--vc-topbar-height)] w-full max-w-5xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <img
            src={photoSrc}
            alt=""
            className="h-7 w-7 shrink-0 rounded-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight text-ink">{basics.name}</div>
            {role ? <div className="hidden truncate text-2xs text-ink-subtle sm:block">{role}</div> : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {actions}

          {actions && (github || linkedin || basics.email) ? (
            <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
          ) : null}

          {github ? (
            <a
              className={iconLinkClass}
              href={github.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`GitHub (${t('opensInNewTab')})`}
              tabIndex={visible ? undefined : -1}
            >
              <SiGithubIcon className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}

          {linkedin ? (
            <a
              className={iconLinkClass}
              href={linkedin.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`LinkedIn (${t('opensInNewTab')})`}
              tabIndex={visible ? undefined : -1}
            >
              <SiLinkedinIcon className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}

          {basics.email ? (
            <a
              className={iconLinkClass}
              href={`mailto:${basics.email}`}
              aria-label={basics.email}
              tabIndex={visible ? undefined : -1}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )

  // The app is client-rendered (`createRoot` + `createBrowserRouter`), so `document.body` exists
  // by the first render; the guard is only there for a non-DOM environment.
  return typeof document === 'undefined' ? null : createPortal(bar, document.body)
}
