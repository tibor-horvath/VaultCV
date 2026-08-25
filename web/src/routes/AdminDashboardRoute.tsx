import { ArrowRight, ExternalLink, KeyRound, Link2, Shield, SquarePen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { LanguageSelector } from '../components/LanguageSelector'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ThemeToggle } from '../components/ThemeToggle'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useLoadingIndicator } from '../lib/loadingIndicator'
import { fetchAuthMe, extractEmailFromPrincipal, type ClientPrincipal } from '../lib/adminAuth'
import { useI18n } from '../lib/i18n'
import { AdminPageHeader } from './AdminPageHeader'

/** One of the two things an admin can do. Whole card is the link, so the hit target is generous. */
function AdminTile({
  to,
  icon,
  title,
  description,
  openLabel,
}: {
  to: string
  icon: ReactNode
  title: string
  description: string
  openLabel: string
}) {
  return (
    <Link
      to={to}
      className="vc-focusable group vc-card flex flex-col p-5 transition-[border-color,box-shadow] duration-150 ease-emphasis hover:border-line-strong hover:shadow-raised"
    >
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-field border border-line bg-surface-muted text-ink-muted"
        aria-hidden="true"
      >
        {icon}
      </span>
      <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
        {openLabel}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </span>
    </Link>
  )
}

export function AdminDashboardRoute() {
  const { t } = useI18n()
  const [me, setMe] = useState<ClientPrincipal | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const isAdmin = useMemo(() => (me?.userRoles ?? []).includes('admin'), [me])

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

  const showSessionLoader = useLoadingIndicator(meLoading)

  if (meLoading) {
    // Render nothing until the loader is due, so a warm session never flashes a spinner. Falling
    // through here would flash the signed-out page instead.
    return showSessionLoader ? <LoadingSpinner label={t('adminSessionChecking')} className="py-10" /> : null
  }

  if (!me) {
    return (
      <div className="mx-auto w-full max-w-lg py-10">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-ink">
              <Shield className="h-5 w-5 text-ink-subtle" aria-hidden="true" />
              <h1 className="text-lg font-semibold">{t('adminPortal')}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{t('adminSignInHint')}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ButtonLink
              variant="primary"
              size="lg"
              href="/.auth/login/aad"
              iconLeft={<KeyRound className="h-4 w-4" aria-hidden="true" />}
              iconRight={<ExternalLink className="h-4 w-4 opacity-70" aria-hidden="true" />}
            >
              {t('adminSignIn')}
            </ButtonLink>
            <a
              className="vc-focusable rounded-sm text-xs font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
              href="/.auth/me"
              target="_blank"
              rel="noreferrer"
            >
              {t('adminViewCurrentIdentity')}
            </a>
          </div>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-lg py-10">
        <Card>
          <div className="flex items-center gap-2 text-ink">
            <Shield className="h-5 w-5 text-ink-subtle" aria-hidden="true" />
            <h1 className="text-lg font-semibold">{t('adminPortal')}</h1>
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            {t('adminNoRole').replace('{email}', me.userDetails ?? t('adminUnknownUser'))}
          </p>
          <Button
            size="sm"
            className="mt-5"
            onClick={() => {
              window.location.href = '/.auth/logout'
            }}
          >
            {t('adminSignOut')}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 py-2">
      <AdminPageHeader
        title={t('adminPortal')}
        icon={<Shield className="h-5 w-5 text-ink-subtle" aria-hidden="true" />}
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

      <p className="text-sm text-ink-muted">{t('adminChooseManage')}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AdminTile
          to="/admin/editor"
          icon={<SquarePen className="h-4 w-4" />}
          title={t('adminEditCv')}
          description={t('adminEditCvTileDescription')}
          openLabel={t('adminOpen')}
        />
        <AdminTile
          to="/admin/share"
          icon={<Link2 className="h-4 w-4" />}
          title={t('adminShareCv')}
          description={t('adminShareCvTileDescription')}
          openLabel={t('adminOpen')}
        />
      </div>
    </div>
  )
}
