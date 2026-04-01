import type { LocalizedCvData } from '../types/localization'
import type { ApiClient, ApiErrorCode, ApiResult } from './apiTypes'
import { isValidCvPayload, mapServerMessageToCode } from './apiTypes'

export class RealApiClient implements ApiClient {
  async fetchCv(_token: string, locale: string): Promise<ApiResult<LocalizedCvData>> {
    const url = '/api/cv'
    const headers: Record<string, string> = {
      accept: 'application/json',
      'accept-language': locale,
    }

    let res: Response
    try {
      res = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'same-origin',
      })
    } catch {
      return { ok: false, status: 0, code: 'network_error' }
    }

    if (!res.ok) {
      let code: ApiErrorCode = 'request_failed'
      let details: string | undefined
      try {
        const body = (await res.json()) as { error?: string }
        if (body?.error) {
          code = mapServerMessageToCode(body.error) ?? code
          if (code === 'request_failed') details = body.error
        }
      } catch {
        // ignore
      }
      return { ok: false, status: res.status, code, details }
    }

    try {
      const data = (await res.json()) as unknown
      if (!isValidCvPayload(data)) {
        return { ok: false, status: 500, code: 'invalid_cv_payload' }
      }
      const expHeader = res.headers.get('x-cv-session-exp')?.trim() ?? ''
      const expSeconds = Number.parseInt(expHeader, 10)
      const sessionExpiresAt =
        Number.isFinite(expSeconds) && expSeconds > 0 ? new Date(expSeconds * 1000).toISOString() : undefined
      return { ok: true, data, sessionExpiresAt }
    } catch {
      return { ok: false, status: 500, code: 'invalid_json_response' }
    }
  }

  async exchangeAccessCode(code: string): Promise<ApiResult<{ accessToken: string }>> {
    const url = '/api/auth'
    const normalized = code.trim()
    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ shareId: normalized }),
        credentials: 'same-origin',
      })
    } catch {
      return { ok: false, status: 0, code: 'network_error' }
    }

    if (!res.ok) {
      let apiCode: ApiErrorCode = 'request_failed'
      let details: string | undefined
      try {
        const body = (await res.json()) as { error?: string }
        if (body?.error) {
          apiCode = mapServerMessageToCode(body.error) ?? apiCode
          if (apiCode === 'request_failed') details = body.error
        }
      } catch {
        // ignore
      }
      return { ok: false, status: res.status, code: apiCode, details }
    }

    try {
      const data = (await res.json()) as { accessToken?: unknown }
      if (typeof data.accessToken !== 'string' || !data.accessToken.trim()) {
        return { ok: false, status: 500, code: 'invalid_json_response' }
      }
      return { ok: true, data: { accessToken: data.accessToken } }
    } catch {
      return { ok: false, status: 500, code: 'invalid_json_response' }
    }
  }
}
