import type { LocalizedCvData } from '../types/localization'
import { getMockCv } from './mockCv'
import type { ApiClient, ApiResult } from './apiTypes'

type MockSession = { token: string; expiresAtMs: number }

export class MockApiClient implements ApiClient {
  private sessions = new Map<string, MockSession>()
  private counter = 0

  private createSession(code: string) {
    const normalized = code.trim().toLowerCase()
    const now = Date.now()
    const ttlMs =
      normalized.includes('expired') ? -60_000 : normalized.includes('soon') ? 30 * 60_000 : 2 * 60 * 60_000
    const expiresAtMs = now + ttlMs
    this.counter += 1
    const token = `mock-session-${this.counter}`
    const session = { token, expiresAtMs }
    this.sessions.set(token, session)
    return session
  }

  private getExpiresAtIso(token: string): string | undefined {
    const session = this.sessions.get(token.trim())
    if (!session) return undefined
    if (session.expiresAtMs <= Date.now()) return undefined
    return new Date(session.expiresAtMs).toISOString()
  }

  async exchangeAccessCode(code: string): Promise<ApiResult<{ accessToken: string }>> {
    const session = this.createSession(code || 'mock')
    return { ok: true, data: { accessToken: session.token } }
  }

  async fetchCv(token: string, locale: string): Promise<ApiResult<LocalizedCvData>> {
    const exp = this.getExpiresAtIso(token)
    if (!exp) return { ok: false, status: 401, code: 'unauthorized' }
    return { ok: true, data: getMockCv(locale), sessionExpiresAt: exp }
  }
}

