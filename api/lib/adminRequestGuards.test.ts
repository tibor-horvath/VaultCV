import { afterEach, describe, expect, it } from 'vitest'
import { readAllowedOriginsFromEnv, requireAdminMutationHeader, requireJsonContentType, requireSameOriginMutation } from './adminRequestGuards'

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

afterEach(() => resetEnv())

describe('readAllowedOriginsFromEnv', () => {
  it('returns empty array when env var is not set', () => {
    delete process.env.CV_ALLOWED_ORIGINS
    expect(readAllowedOriginsFromEnv()).toEqual([])
  })

  it('returns empty array when env var is empty', () => {
    process.env.CV_ALLOWED_ORIGINS = ''
    expect(readAllowedOriginsFromEnv()).toEqual([])
  })

  it('parses a single origin', () => {
    process.env.CV_ALLOWED_ORIGINS = 'http://localhost:5173'
    expect(readAllowedOriginsFromEnv()).toEqual(['http://localhost:5173'])
  })

  it('parses multiple comma-separated origins and trims whitespace', () => {
    process.env.CV_ALLOWED_ORIGINS = 'http://localhost:5173, https://app.example.com , https://other.com'
    expect(readAllowedOriginsFromEnv()).toEqual([
      'http://localhost:5173',
      'https://app.example.com',
      'https://other.com',
    ])
  })
})

describe('requireSameOriginMutation', () => {
  it('returns 403 when both Origin and Referer are absent', () => {
    const result = requireSameOriginMutation({ host: 'example.com' })
    expect(result).toMatchObject({ ok: false, status: 403, error: 'Missing Origin/Referer.' })
  })

  it('returns 500 when host cannot be determined (no x-forwarded-host or host header)', () => {
    const result = requireSameOriginMutation({ origin: 'https://example.com' })
    expect(result).toMatchObject({ ok: false, status: 500 })
  })

  it('allows same-origin request matching x-forwarded-host', () => {
    const result = requireSameOriginMutation({
      origin: 'https://example.com',
      'x-forwarded-host': 'example.com',
      'x-forwarded-proto': 'https',
    })
    expect(result).toMatchObject({ ok: true })
  })

  it('blocks cross-origin request', () => {
    const result = requireSameOriginMutation({
      origin: 'https://evil.com',
      'x-forwarded-host': 'example.com',
      'x-forwarded-proto': 'https',
    })
    expect(result).toMatchObject({ ok: false, status: 403, error: 'Cross-site request blocked.' })
  })

  it('uses host header when x-forwarded-host is absent', () => {
    const result = requireSameOriginMutation({
      origin: 'https://example.com',
      host: 'example.com',
    })
    expect(result).toMatchObject({ ok: true })
  })

  it('defaults to https when x-forwarded-proto is absent', () => {
    const result = requireSameOriginMutation({
      origin: 'https://example.com',
      host: 'example.com',
    })
    expect(result).toMatchObject({ ok: true })
  })

  it('uses http when x-forwarded-proto is http', () => {
    const result = requireSameOriginMutation({
      origin: 'http://example.com',
      host: 'example.com',
      'x-forwarded-proto': 'http',
    })
    expect(result).toMatchObject({ ok: true })
  })

  it('falls back to Referer when Origin is absent', () => {
    const result = requireSameOriginMutation({
      referer: 'https://example.com/some/page',
      'x-forwarded-host': 'example.com',
      'x-forwarded-proto': 'https',
    })
    expect(result).toMatchObject({ ok: true })
  })

  it('allows request when Origin is in the allowedOrigins list', () => {
    const result = requireSameOriginMutation(
      { origin: 'http://localhost:5173' },
      { allowedOrigins: ['http://localhost:5173'] },
    )
    expect(result).toMatchObject({ ok: true })
  })

  it('blocks request when Origin is not in the allowedOrigins list', () => {
    const result = requireSameOriginMutation(
      { origin: 'http://attacker.com' },
      { allowedOrigins: ['http://localhost:5173'] },
    )
    expect(result).toMatchObject({ ok: false, status: 403 })
  })
})

describe('requireJsonContentType', () => {
  it('returns 415 when content-type header is absent', () => {
    expect(requireJsonContentType({})).toMatchObject({ ok: false, status: 415 })
  })

  it('returns 415 for text/plain content-type', () => {
    expect(requireJsonContentType({ 'content-type': 'text/plain' })).toMatchObject({ ok: false, status: 415 })
  })

  it('returns 415 for multipart/form-data', () => {
    expect(requireJsonContentType({ 'content-type': 'multipart/form-data' })).toMatchObject({ ok: false, status: 415 })
  })

  it('returns ok for application/json', () => {
    expect(requireJsonContentType({ 'content-type': 'application/json' })).toMatchObject({ ok: true })
  })

  it('returns ok for application/json with charset', () => {
    expect(requireJsonContentType({ 'content-type': 'application/json; charset=utf-8' })).toMatchObject({ ok: true })
  })

  it('is case-insensitive', () => {
    expect(requireJsonContentType({ 'Content-Type': 'Application/JSON' })).toMatchObject({ ok: true })
  })
})

describe('requireAdminMutationHeader', () => {
  it('returns 400 when header is absent', () => {
    expect(requireAdminMutationHeader({})).toMatchObject({ ok: false, status: 400 })
  })

  it('returns 400 when header value is "true"', () => {
    expect(requireAdminMutationHeader({ 'x-cv-admin': 'true' })).toMatchObject({ ok: false, status: 400 })
  })

  it('returns 400 when header value is "yes"', () => {
    expect(requireAdminMutationHeader({ 'x-cv-admin': 'yes' })).toMatchObject({ ok: false, status: 400 })
  })

  it('returns ok when header value is "1"', () => {
    expect(requireAdminMutationHeader({ 'x-cv-admin': '1' })).toMatchObject({ ok: true })
  })

  it('returns ok when header value is "1" with surrounding whitespace', () => {
    expect(requireAdminMutationHeader({ 'x-cv-admin': '  1  ' })).toMatchObject({ ok: true })
  })
})
