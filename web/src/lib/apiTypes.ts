import type { LocalizedCvData } from '../types/localization'

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
  | { ok: true; data: T; sessionExpiresAt?: string }
  | { ok: false; status: number; code: ApiErrorCode; details?: string }

export type ApiClient = {
  fetchCv: (token: string, locale: string) => Promise<ApiResult<LocalizedCvData>>
  exchangeAccessCode: (code: string) => Promise<ApiResult<{ accessToken: string }>>
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((x) => typeof x === 'string')
}

export function isValidCvPayload(data: unknown): data is LocalizedCvData {
  if (!isObject(data)) return false
  if (!isObject(data.basics)) return false
  if (typeof data.basics.name !== 'string' || typeof data.basics.headline !== 'string') return false
  if (data.basics.mobile !== undefined && typeof data.basics.mobile !== 'string') return false
  if (data.skills !== undefined && !isStringArray(data.skills)) return false
  if (data.languages !== undefined && !isStringArray(data.languages)) return false
  if (data.experience !== undefined && !Array.isArray(data.experience)) return false
  if (data.projects !== undefined && !Array.isArray(data.projects)) return false
  if (data.education !== undefined && !Array.isArray(data.education)) return false
  if (data.credentials !== undefined && !Array.isArray(data.credentials)) return false
  if (data.links !== undefined && !Array.isArray(data.links)) return false
  return true
}

export function mapServerMessageToCode(message: string): ApiErrorCode | null {
  if (message === 'Invalid token format.') return 'invalid_token_format'
  if (message === 'Unauthorized') return 'unauthorized'
  if (message === 'Server is not configured.') return 'server_not_configured'
  if (message === 'Server token is invalid.') return 'server_token_invalid'
  if (message === 'CV data is not configured.') return 'cv_data_not_configured'
  if (message === 'CV data is invalid JSON.') return 'cv_data_invalid_json'
  return null
}

