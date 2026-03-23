import type { LocalizedCvData } from '../types/localization'
import { getMockCv } from './mockCv'
import type { Locale } from './i18n'

export type ApiErrorCode =
  | 'network_error'
  | 'request_failed'
  | 'invalid_json_response'
  | 'invalid_cv_payload'
  | 'invalid_token_format'
  | 'unauthorized'
  | 'server_not_configured'
  | 'server_token_invalid'
  | 'cv_data_not_configured'
  | 'cv_data_invalid_json'

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: ApiErrorCode; details?: string }

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((x) => typeof x === 'string')
}

function isValidCvPayload(data: unknown): data is LocalizedCvData {
  if (!isObject(data)) return false
  if (!isObject(data.basics)) return false
  if (typeof data.basics.name !== 'string' || typeof data.basics.headline !== 'string') return false
  if (data.skills !== undefined && !isStringArray(data.skills)) return false
  if (data.languages !== undefined && !isStringArray(data.languages)) return false
  if (data.experience !== undefined && !Array.isArray(data.experience)) return false
  if (data.projects !== undefined && !Array.isArray(data.projects)) return false
  if (data.education !== undefined && !Array.isArray(data.education)) return false
  if (data.credentials !== undefined && !Array.isArray(data.credentials)) return false
  if (data.links !== undefined && !Array.isArray(data.links)) return false
  return true
}

function mapServerMessageToCode(message: string): ApiErrorCode | null {
  if (message === 'Invalid token format.') return 'invalid_token_format'
  if (message === 'Unauthorized') return 'unauthorized'
  if (message === 'Server is not configured.') return 'server_not_configured'
  if (message === 'Server token is invalid.') return 'server_token_invalid'
  if (message === 'CV data is not configured.') return 'cv_data_not_configured'
  if (message === 'CV data is invalid JSON.') return 'cv_data_invalid_json'
  return null
}

export async function fetchCv(token: string, locale: Locale): Promise<ApiResult<LocalizedCvData>> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_CV === '1') {
    return { ok: true, data: getMockCv(locale) }
  }

  const url = `/api/cv?lang=${encodeURIComponent(locale)}`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
      },
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
    return { ok: true, data }
  } catch {
    return { ok: false, status: 500, code: 'invalid_json_response' }
  }
}

export async function exchangeAccessCode(code: string): Promise<ApiResult<{ accessToken: string }>> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_CV === '1') {
    return { ok: true, data: { accessToken: code || 'mock-access-token' } }
  }

  const url = '/api/auth'
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ code }),
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

