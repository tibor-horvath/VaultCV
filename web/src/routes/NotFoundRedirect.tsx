import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppView } from '../lib/appView'
import { fetchCv } from '../lib/api'
import { useI18n } from '../lib/i18n'

/**
 * Handles unknown paths: replaces URL with `/` and shows landing, or CV when a valid session cookie exists.
 */
export function NotFoundRedirect() {
  const navigate = useNavigate()
  const { openCv, goHome } = useAppView()
  const { locale, t } = useI18n()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await fetchCv('', locale)
      if (cancelled) return
      if (res.ok) {
        openCv()
      } else {
        goHome()
      }
      navigate('/', { replace: true })
    })()
    return () => {
      cancelled = true
    }
  }, [navigate, openCv, goHome, locale])

  return (
    <div className="flex flex-1 items-center justify-center py-16 text-sm text-slate-500 dark:text-slate-400" aria-busy="true">
      {t('loading')}
    </div>
  )
}
