import { Calendar } from 'lucide-react'
import type { CvCredential, CvCredentialIssuer } from '../../types/cv'
import type { MessageKey } from '../../i18n/messages'
import { CredentialIssuerIcon } from './CredentialIssuerIcon'

const preferredCredentialIssuerOrder = ['microsoft', 'aws', 'google', 'school', 'language', 'other'] as const

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
    ? 'font-semibold text-slate-900 underline underline-offset-4 decoration-slate-300 hover:decoration-slate-500 dark:text-slate-100 dark:decoration-slate-700 dark:hover:decoration-slate-500'
    : 'font-semibold text-slate-900 dark:text-slate-100'
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
      new Set((credentials ?? []).map((c) => String(c.issuer ?? '').trim().toLowerCase()).filter(Boolean)),
    ).filter((issuer) => !preferredCredentialIssuerOrder.includes(issuer as (typeof preferredCredentialIssuerOrder)[number])),
  ]

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
      {issuerKeys
        .map((issuer) => {
          const items = credentials?.filter((c) => String(c.issuer ?? '').trim().toLowerCase() === issuer) ?? []
          if (!items.length) return null
          return (
            <div key={issuer}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                <CredentialIssuerIcon issuer={issuer as CvCredentialIssuer} />
                {formatCredentialIssuerLabel(issuer, t)}
              </div>
              <div className="mt-2 divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {items.map((c) => {
                  const url = String(c.url ?? '').trim()
                  const hasLink = Boolean(url)
                  return (
                    <article key={`${c.issuer}:${c.label}:${c.url}:${c.dateEarned ?? ''}:${c.dateExpires ?? ''}`} className="py-3.5">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                        <div className="min-w-0">
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
                            <div className={credentialTitleClassName(false)}>{c.label}</div>
                          )}
                          {showDates && (c.dateEarned || c.dateExpires) ? (
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                              {c.dateEarned ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 opacity-80" />
                                  {t('earned')} {c.dateEarned}
                                </span>
                              ) : null}
                              {c.dateExpires ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 opacity-80" />
                                  {t('expires')} {c.dateExpires}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
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
