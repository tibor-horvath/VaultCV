import { describe, expect, it } from 'vitest'
import type { CvCredential } from '../../types/cv'
import { credentialValidUntil, isCredentialExpired, printableCredentials } from './credentials'

const cred = (dateExpires?: string): CvCredential => ({ issuer: 'aws', label: 'x', dateExpires })

describe('credentialValidUntil', () => {
  it('runs a year-month expiry to the end of that month', () => {
    const d = credentialValidUntil('2026-02')!
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 1, 28])
  })

  it('runs a year-only expiry to the end of the year', () => {
    const d = credentialValidUntil('2026')!
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 11, 31])
  })

  it('uses an explicit day as-is', () => {
    const d = credentialValidUntil('2026-11-05')!
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 5])
  })

  it('returns null for missing or unrecognisable values', () => {
    expect(credentialValidUntil(undefined)).toBeNull()
    expect(credentialValidUntil('')).toBeNull()
    expect(credentialValidUntil('soon')).toBeNull()
    expect(credentialValidUntil('2026-13')).toBeNull()
  })
})

describe('isCredentialExpired', () => {
  const now = new Date(2026, 9, 2, 12)

  it('is expired once the expiry period has fully passed', () => {
    expect(isCredentialExpired(cred('2026-09'), now)).toBe(true)
    expect(isCredentialExpired(cred('2025'), now)).toBe(true)
  })

  it('is still valid during the expiry month', () => {
    expect(isCredentialExpired(cred('2026-10'), now)).toBe(false)
  })

  it('never expires without a parseable expiry date', () => {
    expect(isCredentialExpired(cred(undefined), now)).toBe(false)
    expect(isCredentialExpired(cred('n/a'), now)).toBe(false)
  })
})

describe('printableCredentials', () => {
  it('drops expired credentials and keeps the rest in order', () => {
    const now = new Date(2026, 9, 2)
    const list = [cred('2026-03'), cred(), cred('2027-06')]
    expect(printableCredentials(list, now)).toEqual([list[1], list[2]])
    expect(printableCredentials(undefined, now)).toEqual([])
  })
})
