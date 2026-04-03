import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/localeRegistry', () => ({
  readSupportedLocalesCached: vi.fn(async () => ['en', 'hu']),
  readSupportedLocalesForProfileCached: vi.fn(async () => ['en']),
}))

import { readSupportedLocalesCached, readSupportedLocalesForProfileCached } from '../lib/localeRegistry'
import handler from './index'

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

afterEach(() => {
  vi.restoreAllMocks()
  resetEnv()
})

describe('/api/locales', () => {
  it('returns 500 when CV_PROFILE_SLUG is not configured', async () => {
    delete process.env.CV_PROFILE_SLUG
    const context: { res?: unknown } = {}
    await handler(context, {})
    expect(context.res).toMatchObject({ status: 500, body: { error: 'CV_PROFILE_SLUG is not configured.' } })
  })

  it('returns all locales when scope is not specified', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: { res?: unknown } = {}
    await handler(context, { query: {} })
    expect(readSupportedLocalesCached).toHaveBeenCalledWith('john-doe')
    expect(context.res).toMatchObject({ status: 200, body: { locales: ['en', 'hu'] } })
  })

  it('returns scoped locales when scope=public', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readSupportedLocalesForProfileCached as ReturnType<typeof vi.fn>).mockResolvedValueOnce(['en'])
    const context: { res?: unknown } = {}
    await handler(context, { query: { scope: 'public' } })
    expect(readSupportedLocalesForProfileCached).toHaveBeenCalledWith('john-doe', 'public')
    expect(context.res).toMatchObject({ status: 200, body: { locales: ['en'] } })
  })

  it('returns scoped locales when scope=private', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readSupportedLocalesForProfileCached as ReturnType<typeof vi.fn>).mockResolvedValueOnce(['en', 'hu'])
    const context: { res?: unknown } = {}
    await handler(context, { query: { scope: 'private' } })
    expect(readSupportedLocalesForProfileCached).toHaveBeenCalledWith('john-doe', 'private')
    expect(context.res).toMatchObject({ status: 200 })
  })

  it('ignores unknown scope values and returns all locales', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: { res?: unknown } = {}
    await handler(context, { query: { scope: 'unknown' } })
    expect(readSupportedLocalesCached).toHaveBeenCalledWith('john-doe')
  })

  it('works when query is undefined', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: { res?: unknown } = {}
    await handler(context, {})
    expect(context.res).toMatchObject({ status: 200 })
  })

  it('returns cache-control: no-store header', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: { res?: unknown } = {}
    await handler(context, { query: {} })
    const res = context.res as { headers: Record<string, string> }
    expect(res.headers['cache-control']).toBe('no-store')
  })
})
