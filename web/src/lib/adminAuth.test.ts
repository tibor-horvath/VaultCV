import { describe, expect, it } from 'vitest'
import { extractEmailFromPrincipal, toErrorMessage } from './adminAuth'

describe('extractEmailFromPrincipal', () => {
  it('returns empty string for null principal', () => {
    expect(extractEmailFromPrincipal(null)).toBe('')
  })

  it('returns empty string for principal with no claims or userDetails', () => {
    expect(extractEmailFromPrincipal({ userId: 'u1' })).toBe('')
  })

  it('extracts email from standard XML SOAP email claim', () => {
    const principal = {
      claims: [
        {
          typ: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
          val: 'user@example.com',
        },
      ],
    }
    expect(extractEmailFromPrincipal(principal)).toBe('user@example.com')
  })

  it('falls back to "email" claim type', () => {
    const principal = {
      claims: [{ typ: 'email', val: 'user@example.com' }],
    }
    expect(extractEmailFromPrincipal(principal)).toBe('user@example.com')
  })

  it('falls back to "emails" claim type', () => {
    const principal = {
      claims: [{ typ: 'emails', val: 'user@emails.com' }],
    }
    expect(extractEmailFromPrincipal(principal)).toBe('user@emails.com')
  })

  it('falls back to "preferred_username" claim type', () => {
    const principal = {
      claims: [{ typ: 'preferred_username', val: 'jsmith' }],
    }
    expect(extractEmailFromPrincipal(principal)).toBe('jsmith')
  })

  it('falls back to userDetails when no matching claims', () => {
    const principal = {
      userDetails: 'user@fallback.com',
      claims: [{ typ: 'unrelated', val: 'x' }],
    }
    expect(extractEmailFromPrincipal(principal)).toBe('user@fallback.com')
  })

  it('trims whitespace from userDetails', () => {
    const principal = {
      userDetails: '  user@trimmed.com  ',
    }
    expect(extractEmailFromPrincipal(principal)).toBe('user@trimmed.com')
  })

  it('prefers email claim over userDetails', () => {
    const principal = {
      userDetails: 'fallback@example.com',
      claims: [{ typ: 'email', val: 'primary@example.com' }],
    }
    expect(extractEmailFromPrincipal(principal)).toBe('primary@example.com')
  })

  it('skips empty claim values and falls through', () => {
    const principal = {
      userDetails: 'fallback@example.com',
      claims: [{ typ: 'email', val: '   ' }],
    }
    expect(extractEmailFromPrincipal(principal)).toBe('fallback@example.com')
  })

  it('is case-insensitive for claim type matching', () => {
    const principal = {
      claims: [{ typ: 'EMAIL', val: 'upper@example.com' }],
    }
    expect(extractEmailFromPrincipal(principal)).toBe('upper@example.com')
  })
})

describe('toErrorMessage', () => {
  it('returns message from an Error instance', () => {
    expect(toErrorMessage(new Error('something went wrong'), 'fallback')).toBe('something went wrong')
  })

  it('returns fallback for non-Error values', () => {
    expect(toErrorMessage('string error', 'fallback')).toBe('fallback')
    expect(toErrorMessage(42, 'fallback')).toBe('fallback')
    expect(toErrorMessage(null, 'fallback')).toBe('fallback')
    expect(toErrorMessage(undefined, 'fallback')).toBe('fallback')
  })

  it('returns fallback when Error has empty message', () => {
    expect(toErrorMessage(new Error(''), 'fallback')).toBe('fallback')
    expect(toErrorMessage(new Error('   '), 'fallback')).toBe('fallback')
  })

  it('returns fallback for Error with non-string message', () => {
    const err = new Error()
    ;(err as unknown as { message: unknown }).message = 123
    expect(toErrorMessage(err, 'fallback')).toBe('fallback')
  })
})
