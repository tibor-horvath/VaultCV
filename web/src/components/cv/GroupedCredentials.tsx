import { Calendar } from 'lucide-react'
import type { CvCredential, CvCredentialIssuer } from '../../types/cv'
import type { MessageKey } from '../../i18n/messages'
import { CredentialIssuerIcon } from './CredentialIssuerIcon'

const preferredCredentialIssuerOrder = ['microsoft', 'aws', 'google', 'cncf', 'school', 'language', 'other'] as const

/** Normalize a raw issuer value to a lowercase trimmed string, falling back to 'other' for blank/missing values. */
function normalizeIssuer(raw: unknown): string {
  return String(raw ?? '').trim().toLowerCase() || 'other'
}

/** Safely convert an arbitrary string to a typed CvCredentialIssuer, mapping unknowns to 'other'. */
function toKnownIssuer(issuer: string): CvCredentialIssuer {
  const known = new Set<string>(preferredCredentialIssuerOrder)
  return known.has(issuer) ? (issuer as CvCredentialIssuer) : 'other'
}

function formatCredentialIssuerLabel(issuer: string, t: (key: MessageKey) => string) {
  if (issuer === 'language') return t('languageExams')
  if (issuer === 'school') return t('education')
  if (issuer === 'other') return t('other')
  if (issuer === 'aws') return 'AWS'
  if (issuer === 'cncf') return 'CNCF'
  const normalized = issuer.replace(/[-_]+/g, ' ').trim()
  if (!normalized) return t('other')
  return normalized
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function credentialTitleClassName(withLink: boolean) {
  return withLink
    ? 'vc-focusable inline-block rounded-sm text-sm font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink-subtle'
    : 'text-sm font-semibold text-ink'
}

export function GroupedCredentials(props: {
  credentials: CvCredential[]
  t: (key: MessageKey) => string
  showDates?: boolean
}) {
  const { credentials, t, showDates = true } = props

  const issuerKeys = [
    ...preferredCredentialIssuerOrder,
    ...Array.from(
      new Set((credentials ?? []).map((c) => normalizeIssuer(c.issuer))),
    ).filter((issuer) => !preferredCredentialIssuerOrder.includes(issuer as (typeof preferredCredentialIssuerOrder)[number])),
  ]

  return (
    <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5 lg:space-y-0">
      {issuerKeys
        .map((issuer) => {
          const items = credentials?.filter((c) => normalizeIssuer(c.issuer) === issuer) ?? []
          if (!items.length) return null
          return (
            <div key={issuer}>
              <h3 className="vc-eyebrow flex items-center gap-2">
                <CredentialIssuerIcon issuer={toKnownIssuer(issuer)} />
                {formatCredentialIssuerLabel(issuer, t)}
              </h3>
              {/* Spacing, not rules: a divider inside one column of the grid stops mid-row and reads as a
                  stray line rather than a separator. */}
              <div className="mt-2 space-y-3">
                {items.map((c) => {
                  const url = String(c.url ?? '').trim()
                  const hasLink = Boolean(url)
                  return (
                    <article key={`${c.issuer}:${c.label}:${c.url}:${c.dateEarned ?? ''}:${c.dateExpires ?? ''}`}>
                      {hasLink ? (
                        <a
                          className={credentialTitleClassName(true)}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {c.label}
                        </a>
                      ) : (
                        <p className={credentialTitleClassName(false)}>{c.label}</p>
                      )}
                      {showDates && (c.dateEarned || c.dateExpires) ? (
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-ink-subtle">
                          {c.dateEarned ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              {t('earned')} {c.dateEarned}
                            </span>
                          ) : null}
                          {c.dateExpires ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              {t('expires')} {c.dateExpires}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </div>
          )
        })
        .filter(Boolean)}
    </div>
  )
}
