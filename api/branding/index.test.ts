import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/profileBlobStore', () => ({
  readBrandingJson: vi.fn(async () => ''),
  writeBrandingJson: vi.fn(async () => undefined),
}))

import { invalidateBrandingCache } from '../lib/branding'
import { readBrandingJson } from '../lib/profileBlobStore'
import handler from './index'

async function run() {
  const context: { res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {}
  await handler(context)
  return context.res!
}

beforeEach(() => {
  process.env.CV_PROFILE_SLUG = 'john-doe'
  invalidateBrandingCache()
})

afterEach(() => {
  vi.clearAllMocks()
  delete process.env.CV_PROFILE_SLUG
})

describe('/api/branding', () => {
  it('returns the stored branding with a short public cache', async () => {
    ;(readBrandingJson as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({ brandmark: { type: 'html', html: '<b>x</b>' } }),
    )
    const res = await run()
    expect(res).toMatchObject({ status: 200, body: { brandmark: { type: 'html', html: '<b>x</b>' } } })
    expect(res.headers?.['cache-control']).toBe('public, max-age=60')
  })

  it('reads storage once per cache window', async () => {
    await run()
    await run()
    expect(readBrandingJson).toHaveBeenCalledTimes(1)
  })

  it('returns 500 when CV_PROFILE_SLUG is missing', async () => {
    delete process.env.CV_PROFILE_SLUG
    expect(await run()).toMatchObject({ status: 500 })
  })

  it('returns 500 when storage fails', async () => {
    ;(readBrandingJson as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('boom'))
    expect(await run()).toMatchObject({ status: 500 })
  })
})
