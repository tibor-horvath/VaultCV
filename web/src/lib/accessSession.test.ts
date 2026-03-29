import { beforeEach, describe, expect, it } from 'vitest'
import { clearStoredAccessCode, getStoredAccessCode, setStoredAccessCode } from './accessSession'

describe('accessSession', () => {
  beforeEach(() => {
    clearStoredAccessCode()
  })

  it('stores trimmed code', () => {
    setStoredAccessCode('  abc  ')
    expect(getStoredAccessCode()).toBe('abc')
  })

  it('clears code', () => {
    setStoredAccessCode('x')
    clearStoredAccessCode()
    expect(getStoredAccessCode()).toBe('')
  })
})
