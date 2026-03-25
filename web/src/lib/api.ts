import type { Locale } from './i18n'
import type { LocalizedCvData } from '../types/localization'
import type { ApiClient } from './apiTypes'
import type { ApiResult } from './apiTypes'
import { MockApiClient } from './mockApiClient'
import { RealApiClient } from './realApiClient'

export type { ApiClient, ApiErrorCode, ApiResult } from './apiTypes'

let client: ApiClient | null = null

function getClient() {
  if (client) return client
  client = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_CV === '1' ? new MockApiClient() : new RealApiClient()
  return client
}

export async function fetchCv(token: string, locale: Locale): Promise<ApiResult<LocalizedCvData>> {
  return getClient().fetchCv(token, locale)
}

export async function exchangeAccessCode(code: string): Promise<ApiResult<{ accessToken: string }>> {
  return getClient().exchangeAccessCode(code)
}

