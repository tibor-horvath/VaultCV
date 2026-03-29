import { useEffect, useRef, useState } from 'react'
import { exchangeAccessCode, fetchCv, type ApiErrorCode } from '../lib/api'
import type { MessageKey } from '../i18n/messages'
import type { CvData } from '../types/cv'
import { clearStoredAccessCode } from '../lib/accessSession'

export type CvRouteState =
  | { kind: 'locked' }
  | { kind: 'expired' }
  | { kind: 'loading' }
  | { kind: 'error'; messageKey: MessageKey; details?: string; status?: number }
  | { kind: 'ready'; cv: CvData; sessionExpiresAt?: string }

export function mapApiErrorToMessage(code: ApiErrorCode): MessageKey {
  if (code === 'network_error') return 'networkError'
  if (code === 'invalid_json_response') return 'invalidJsonResponse'
  if (code === 'invalid_cv_payload') return 'invalidCvPayload'
  if (code === 'invalid_token_format') return 'invalidTokenFormat'
  if (code === 'unauthorized') return 'unauthorized'
  if (code === 'server_not_configured') return 'serverNotConfigured'
  if (code === 'server_token_invalid') return 'serverTokenInvalid'
  if (code === 'cv_data_not_configured') return 'cvDataNotConfigured'
  if (code === 'cv_data_invalid_json') return 'cvDataInvalidJson'
  return 'requestFailed'
}

export function useCvRouteState(accessCode: string, locale: string) {
  const [state, setState] = useState<CvRouteState>({ kind: 'loading' })
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!accessCode && stateRef.current.kind === 'ready') return
      setState({ kind: 'loading' })
      let tokenForFetch = ''
      if (accessCode) {
        const exchangeRes = await exchangeAccessCode(accessCode)
        if (cancelled) return
        if (!exchangeRes.ok) {
          setState({
            kind: 'error',
            messageKey: mapApiErrorToMessage(exchangeRes.code),
            details: exchangeRes.details,
            status: exchangeRes.status,
          })
          return
        }
        tokenForFetch = exchangeRes.data.accessToken
      }

      const res = await fetchCv(tokenForFetch, locale)
      if (cancelled) return

      if (!res.ok) {
        if (res.code === 'unauthorized') {
          clearStoredAccessCode()
          setState({ kind: 'expired' })
          return
        }
        setState({
          kind: 'error',
          messageKey: mapApiErrorToMessage(res.code),
          details: res.details,
          status: res.status,
        })
        return
      }
      clearStoredAccessCode()
      setState({ kind: 'ready', cv: res.data, sessionExpiresAt: res.sessionExpiresAt })
    }

    run()
    return () => {
      cancelled = true
    }
  }, [accessCode, locale])

  return state
}
