import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { setStoredAccessCode } from './accessSession'

/** Reads `?t=`, stores it for session access, then strips `t` and `lang` from the URL bar. */
export function useConsumeUrlAccessToken() {
  const [params] = useSearchParams()
  const urlToken = params.get('t')?.trim() ?? ''

  useEffect(() => {
    if (!urlToken) return
    setStoredAccessCode(urlToken)
    const url = new URL(window.location.href)
    url.searchParams.delete('t')
    url.searchParams.delete('lang')
    const qs = url.searchParams.toString()
    const nextUrl = `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`
    window.history.replaceState(null, '', nextUrl)
  }, [urlToken])

  return urlToken
}
