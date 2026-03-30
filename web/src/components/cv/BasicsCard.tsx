import type { CvBasics, CvLink } from '../../types/cv'
import { useState, type ReactNode } from 'react'
import { Mail, MapPin, Phone, Sparkles } from 'lucide-react'
import { buildPhotoSrc, parseBasicsHeadline } from '../../lib/cvPresentation'
import { BasicsLinksRow } from './BasicsLinksRow'
import { useI18n } from '../../lib/i18n'

export function BasicsCard({
  basics,
  links,
  profilePhotoSrc,
  headerRight,
  topStatus,
  belowLinks,
}: {
  basics: CvBasics
  links?: CvLink[]
  /** When set, used for the avatar `src` instead of `buildPhotoSrc(basics)` (keep in sync with PDF layout). */
  profilePhotoSrc?: string
  headerRight?: ReactNode
  topStatus?: ReactNode
  /** Shown only below GitHub/LinkedIn on narrow screens (e.g. mobile PDF download). */
  belowLinks?: ReactNode
}) {
  const { t } = useI18n()
  const { role, chip } = parseBasicsHeadline(basics.headline)
  const photoSrc = profilePhotoSrc ?? buildPhotoSrc(basics)
  const [isPhoneVisible, setIsPhoneVisible] = useState(false)
  const hasMobile = Boolean(basics.mobile?.trim())

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.55)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/35 sm:p-6">
      {topStatus ? <div className="mb-3 flex w-full justify-center">{topStatus}</div> : null}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="mx-auto flex-shrink-0 sm:mx-0">
          <img
            src={photoSrc}
            alt={basics.photoAlt ?? `${basics.name} profile photo`}
            className="h-48 w-48 rounded-full object-cover shadow-none ring-0 sm:h-56 sm:w-56"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                {basics.name}
              </h1>
              {role ? (
                <div className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{role}</div>
              ) : null}
              {chip ? (
                <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300">
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {chip}
                </div>
              ) : null}
            </div>

            {headerRight ? <div className="pt-1">{headerRight}</div> : null}
          </div>

          {basics.location ? (
            <div className="mt-2 flex items-center gap-2 text-sm leading-none text-slate-600 dark:text-slate-400">
              <MapPin className="h-[1em] w-[1em] shrink-0 translate-y-[0.08em]" aria-hidden="true" />
              <span>{basics.location}</span>
            </div>
          ) : null}

          {basics.email ? (
            <a
              href={`mailto:${basics.email}`}
              className="mt-2 flex w-fit items-center gap-2 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              {basics.email}
            </a>
          ) : null}

          {hasMobile ? (
            isPhoneVisible ? (
              <a
                href={`tel:${String(basics.mobile).trim()}`}
                className="mt-2 flex w-fit items-center gap-2 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                {String(basics.mobile).trim()}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setIsPhoneVisible(true)}
                className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900"
                aria-label={t('revealPhone')}
              >
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t('revealPhone')}
              </button>
            )
          ) : null}

          {basics.summary ? (
            <p className="mt-4 max-w-3xl text-pretty text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {basics.summary}
            </p>
          ) : null}

          <BasicsLinksRow links={links} />
          {belowLinks ? <div className="mt-3 sm:hidden">{belowLinks}</div> : null}
        </div>
      </div>
    </div>
  )
}

