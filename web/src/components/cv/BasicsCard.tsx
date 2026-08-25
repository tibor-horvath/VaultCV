import type { CvBasics, CvLink } from '../../types/cv'
import { useState, type ReactNode } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import { buildPhotoSrc, parseBasicsHeadline } from '../../lib/cvPresentation'
import { BasicsLinksRow } from './BasicsLinksRow'
import { useI18n } from '../../lib/i18n'
import { Card } from '../ui/Card'
import { cn } from '../ui/cn'

/** Location / email / phone share one dense meta row instead of three stacked lines. */
const metaItemClass = 'inline-flex items-center gap-1.5 text-sm text-ink-muted'
const metaLinkClass = `vc-focusable rounded-sm ${metaItemClass} hover:text-ink`

export function BasicsCard({
  basics,
  links,
  profilePhotoSrc,
  showPhoto = true,
  headerRight,
  topStatus,
  belowLinks,
}: {
  basics: CvBasics
  links?: CvLink[]
  /** When set, used for the avatar `src` instead of `buildPhotoSrc(basics)` (keep in sync with PDF layout). */
  profilePhotoSrc?: string
  showPhoto?: boolean
  headerRight?: ReactNode
  topStatus?: ReactNode
  /** Shown only below GitHub/LinkedIn on narrow screens (e.g. mobile PDF download). */
  belowLinks?: ReactNode
}) {
  const { t } = useI18n()
  const { role, chip } = parseBasicsHeadline(basics.headline)
  const photoSrc = profilePhotoSrc ?? buildPhotoSrc(basics)
  const [isPhoneVisible, setIsPhoneVisible] = useState(false)
  // The photo is the largest element and decodes last, so it would otherwise pop in a beat after
  // the rest of the card has already faded up.
  const [isPhotoLoaded, setIsPhotoLoaded] = useState(false)
  const hasMobile = Boolean(basics.mobile?.trim())
  const hasMeta = Boolean(basics.location || basics.email || hasMobile)

  return (
    <Card>
      {topStatus ? <div className="mb-4 flex w-full justify-center">{topStatus}</div> : null}

      <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
        {showPhoto ? (
          <div className="mx-auto shrink-0 sm:mx-0">
            {/*
              Reserved box at the final size: the placeholder holds the layout while the photo
              decodes, so the name and summary never jump when it lands.
            */}
            <div className="h-40 w-40 overflow-hidden rounded-full bg-surface-muted ring-1 ring-line sm:h-48 sm:w-48">
              <img
                src={photoSrc}
                alt={basics.photoAlt ?? `${basics.name} profile photo`}
                className={cn(
                  'h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none',
                  isPhotoLoaded ? 'opacity-100' : 'opacity-0',
                )}
                loading="lazy"
                decoding="async"
                // A cached image can finish before React attaches `onLoad`, which would leave it at
                // opacity 0 forever.
                ref={(node) => {
                  if (node?.complete) setIsPhotoLoaded(true)
                }}
                onLoad={() => setIsPhotoLoaded(true)}
                // Reveal on failure too, otherwise a broken or blocked image would sit at opacity 0
                // forever instead of showing the browser's own missing-image affordance.
                onError={() => setIsPhotoLoaded(true)}
              />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{basics.name}</h1>
              {role ? <p className="mt-1 text-base font-medium text-ink-muted">{role}</p> : null}
              {chip ? (
                <p className="vc-eyebrow mt-2 text-ink-subtle">{chip}</p>
              ) : null}
            </div>

            {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
          </div>

          {hasMeta ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {basics.location ? (
                <span className={metaItemClass}>
                  <MapPin className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                  {basics.location}
                </span>
              ) : null}

              {basics.email ? (
                <a href={`mailto:${basics.email}`} className={metaLinkClass}>
                  <Mail className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                  {basics.email}
                </a>
              ) : null}

              {hasMobile ? (
                isPhoneVisible ? (
                  <a href={`tel:${String(basics.mobile).trim()}`} className={metaLinkClass}>
                    <Phone className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                    {String(basics.mobile).trim()}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPhoneVisible(true)}
                    className={cn(metaLinkClass, 'underline decoration-line-strong underline-offset-4')}
                  >
                    <Phone className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                    {t('revealPhone')}
                  </button>
                )
              ) : null}
            </div>
          ) : null}

          {basics.summary ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">{basics.summary}</p>
          ) : null}

          <BasicsLinksRow links={links} className="mt-5 flex flex-wrap gap-2" />
          {belowLinks ? <div className="mt-4 sm:hidden">{belowLinks}</div> : null}
        </div>
      </div>
    </Card>
  )
}
