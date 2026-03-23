import type { CvData } from '../types/cv'
import { getMockCv } from './mockCv'

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string }

export async function fetchCv(token: string): Promise<ApiResult<CvData>> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_CV === '1') {
    return { ok: true, data: getMockCv() }
  }

  const url = `/api/cv?t=${encodeURIComponent(token)}`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
    })
  } catch {
    return { ok: false, status: 0, message: 'Network error' }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      // ignore
    }
    return { ok: false, status: res.status, message }
  }

  try {
    const data = (await res.json()) as CvData
    if (!data?.basics?.name || !data?.basics?.headline) {
      return { ok: false, status: 500, message: 'CV payload is missing basics.' }
    }
    return { ok: true, data }
  } catch {
    return { ok: false, status: 500, message: 'Invalid JSON response.' }
  }
}

