import crypto from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import { SESSION_COOKIE_NAME, readAccessToken, verifySessionToken } from './sessionAuth'

const originalEnv = { ...process.env }

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key]
  }
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}

function makeToken(payload: object, signingSecret: string) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', signingSecret).update(encodedPayload).digest('base64url')
  return `${encodedPayload}.${signature}`
}

afterEach(() => {
  resetEnv()
})

describe('verifySessionToken', () => {
  it('returns missing_token for empty string', () => {
    expect(verifySessionToken('')).toEqual({ ok: false, reason: 'missing_token' })
  })

  it('returns invalid_format for single-part token', () => {
    expect(verifySessionToken('abc')).toEqual({ ok: false, reason: 'invalid_format' })
  })

  it('returns invalid_format for token with three parts', () => {
    expect(verifySessionToken('a.b.c')).toEqual({ ok: false, reason: 'invalid_format' })
  })

  it('returns missing_signing_secret when env var is not set', () => {
    delete process.env.CV_SESSION_SIGNING_KEY
    expect(verifySessionToken('abc.def')).toEqual({ ok: false, reason: 'missing_signing_secret' })
  })

  it('returns missing_signing_secret when env var is empty string', () => {
    process.env.CV_SESSION_SIGNING_KEY = '  '
    expect(verifySessionToken('abc.def')).toEqual({ ok: false, reason: 'missing_signing_secret' })
  })

  it('returns signature_mismatch when token signed with wrong secret', () => {
    process.env.CV_SESSION_SIGNING_KEY = 'correct-secret'
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600, shareId: 'abc' }, 'wrong-secret')
    expect(verifySessionToken(token)).toEqual({ ok: false, reason: 'signature_mismatch' })
  })

  it('returns expired for past expiry', () => {
    const secret = 'my-secret'
    process.env.CV_SESSION_SIGNING_KEY = secret
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 1 }, secret)
    expect(verifySessionToken(token)).toEqual({ ok: false, reason: 'expired' })
  })

  it('returns expired when exp equals current time', () => {
    const secret = 'my-secret'
    process.env.CV_SESSION_SIGNING_KEY = secret
    const now = Math.floor(Date.now() / 1000)
    const token = makeToken({ exp: now }, secret)
    expect(verifySessionToken(token)).toEqual({ ok: false, reason: 'expired' })
  })

  it('returns invalid_payload for Infinity exp', () => {
    const secret = 'my-secret'
    process.env.CV_SESSION_SIGNING_KEY = secret
    // JSON.stringify serializes NaN as null (which becomes 0, treated as expired),
    // but we can test with a string-type exp which makes isFinite fail.
    const encodedPayload = Buffer.from(JSON.stringify({ exp: 'not-a-number' })).toString('base64url')
    const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url')
    expect(verifySessionToken(`${encodedPayload}.${signature}`)).toEqual({ ok: false, reason: 'invalid_payload' })
  })

  it('returns invalid_payload for non-JSON payload', () => {
    const secret = 'my-secret'
    process.env.CV_SESSION_SIGNING_KEY = secret
    const encodedPayload = Buffer.from('not-valid-json!!!').toString('base64url')
    const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url')
    expect(verifySessionToken(`${encodedPayload}.${signature}`)).toEqual({ ok: false, reason: 'invalid_payload' })
  })

  it('returns ok: true for valid token with shareId', () => {
    const secret = 'my-secret'
    process.env.CV_SESSION_SIGNING_KEY = secret
    const exp = Math.floor(Date.now() / 1000) + 3600
    const token = makeToken({ exp, shareId: 'share-abc' }, secret)
    expect(verifySessionToken(token)).toMatchObject({ ok: true, exp, shareId: 'share-abc' })
  })

  it('returns ok: true without shareId when payload omits it', () => {
    const secret = 'my-secret'
    process.env.CV_SESSION_SIGNING_KEY = secret
    const exp = Math.floor(Date.now() / 1000) + 3600
    const token = makeToken({ exp }, secret)
    const result = verifySessionToken(token)
    expect(result).toMatchObject({ ok: true, exp })
    if (result.ok) {
      expect(result.shareId).toBeUndefined()
    }
  })

  it('strips whitespace from signing key env var', () => {
    const secret = 'trimmed-secret'
    process.env.CV_SESSION_SIGNING_KEY = `  ${secret}  `
    const exp = Math.floor(Date.now() / 1000) + 3600
    const token = makeToken({ exp, shareId: 's1' }, secret)
    expect(verifySessionToken(token)).toMatchObject({ ok: true })
  })
})

describe('readAccessToken', () => {
  it('returns source=none when headers is undefined', () => {
    const result = readAccessToken(undefined)
    expect(result.source).toBe('none')
    expect(result.token).toBe('')
    expect(result.hasAuthorizationHeader).toBe(false)
    expect(result.hasSessionHeader).toBe(false)
    expect(result.hasCookieHeader).toBe(false)
  })

  it('returns source=none when all headers are absent', () => {
    const result = readAccessToken({})
    expect(result.source).toBe('none')
    expect(result.token).toBe('')
  })

  it('prefers x-cv-session-token header over cookie and authorization', () => {
    const result = readAccessToken({
      'x-cv-session-token': 'session-tok',
      authorization: 'Bearer bearer-tok',
      cookie: `${SESSION_COOKIE_NAME}=cookie-tok`,
    })
    expect(result.source).toBe('x-cv-session-token')
    expect(result.token).toBe('session-tok')
    expect(result.hasAuthorizationHeader).toBe(true)
    expect(result.authorizationHeaderHasBearer).toBe(true)
    expect(result.hasSessionHeader).toBe(true)
    expect(result.hasCookieHeader).toBe(true)
  })

  it('falls back to cookie when no session header', () => {
    const result = readAccessToken({ cookie: `${SESSION_COOKIE_NAME}=cookietok` })
    expect(result.source).toBe('cookie')
    expect(result.token).toBe('cookietok')
    expect(result.hasCookieHeader).toBe(true)
  })

  it('URL-decodes cookie values', () => {
    const encoded = encodeURIComponent('tok.sig=extra')
    const result = readAccessToken({ cookie: `${SESSION_COOKIE_NAME}=${encoded}` })
    expect(result.source).toBe('cookie')
    expect(result.token).toBe('tok.sig=extra')
  })

  it('parses cookie with multiple cookies', () => {
    const result = readAccessToken({ cookie: `other=val; ${SESSION_COOKIE_NAME}=mytok; another=x` })
    expect(result.source).toBe('cookie')
    expect(result.token).toBe('mytok')
  })

  it('falls back to Bearer authorization header', () => {
    const result = readAccessToken({ authorization: 'Bearer mytoken' })
    expect(result.source).toBe('authorization')
    expect(result.token).toBe('mytoken')
    expect(result.hasAuthorizationHeader).toBe(true)
    expect(result.authorizationHeaderHasBearer).toBe(true)
  })

  it('ignores authorization header when no Bearer prefix', () => {
    const result = readAccessToken({ authorization: 'Basic dXNlcjpwYXNz' })
    expect(result.source).toBe('none')
    expect(result.token).toBe('')
    expect(result.hasAuthorizationHeader).toBe(true)
    expect(result.authorizationHeaderHasBearer).toBe(false)
  })

  it('reports presence flags when token comes from session header', () => {
    const result = readAccessToken({
      'x-cv-session-token': 'tok',
      authorization: 'Bearer b',
      cookie: `${SESSION_COOKIE_NAME}=c`,
    })
    expect(result.hasAuthorizationHeader).toBe(true)
    expect(result.authorizationHeaderHasBearer).toBe(true)
    expect(result.hasSessionHeader).toBe(true)
    expect(result.hasCookieHeader).toBe(true)
  })

  it('skips empty session token header and falls through to cookie', () => {
    const result = readAccessToken({
      'x-cv-session-token': '   ',
      cookie: `${SESSION_COOKIE_NAME}=fallback`,
    })
    expect(result.source).toBe('cookie')
    expect(result.token).toBe('fallback')
  })
})
