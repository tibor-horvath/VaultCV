import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/profileBlobStore', () => ({
  readBrandingJson: vi.fn(async () => ''),
  writeBrandingJson: vi.fn(async () => undefined),
}))

vi.mock('../lib/swaAuth', () => ({
  requireAdmin: vi.fn(() => ({ ok: true, principal: { userId: 'admin-user', userRoles: ['admin'] } })),
}))

import { readBrandingJson, writeBrandingJson } from '../lib/profileBlobStore'
import { requireAdmin } from '../lib/swaAuth'
import handler from './index'

const SVG = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>').toString('base64')}`

function adminHeaders(): Record<string, string> {
  return { origin: 'https://example.com', host: 'example.com', 'x-cv-admin': '1', 'content-type': 'application/json' }
}

async function run(req: { method: string; headers?: Record<string, string>; body?: unknown }) {
  const context: { res?: { status: number; body?: unknown } } = {}
  await handler(context, req)
  return context.res!
}

beforeEach(() => {
  process.env.CV_PROFILE_SLUG = 'john-doe'
})

afterEach(() => {
  vi.clearAllMocks()
  delete process.env.CV_PROFILE_SLUG
})

describe('/api/manage/branding', () => {
  it('returns 401 when admin auth fails', async () => {
    ;(requireAdmin as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: false, status: 401, error: 'Unauthorized' })
    expect(await run({ method: 'GET' })).toMatchObject({ status: 401 })
  })

  it('returns 500 when CV_PROFILE_SLUG is missing', async () => {
    delete process.env.CV_PROFILE_SLUG
    expect(await run({ method: 'GET' })).toMatchObject({ status: 500 })
  })

  it('GET returns an empty document when nothing is stored', async () => {
    expect(await run({ method: 'GET' })).toMatchObject({ status: 200, body: {} })
  })

  it('GET returns the stored branding', async () => {
    ;(readBrandingJson as ReturnType<typeof vi.fn>).mockResolvedValueOnce(JSON.stringify({ favicon: SVG }))
    expect(await run({ method: 'GET' })).toMatchObject({ status: 200, body: { favicon: SVG } })
  })

  it('GET ignores a stored document that no longer validates', async () => {
    ;(readBrandingJson as ReturnType<typeof vi.fn>).mockResolvedValueOnce('{"favicon":"nope"}')
    expect(await run({ method: 'GET' })).toMatchObject({ status: 200, body: {} })
  })

  it('PUT validates and stores the normalized document', async () => {
    const body = { favicon: SVG, brandmark: { type: 'html', html: '<b>hi</b>' } }
    const res = await run({ method: 'PUT', headers: adminHeaders(), body })
    expect(res).toMatchObject({ status: 200, body })
    expect(writeBrandingJson).toHaveBeenCalledWith({ slugFromName: 'john-doe', jsonText: JSON.stringify(body) })
  })

  it('PUT rejects an invalid document without writing', async () => {
    const res = await run({ method: 'PUT', headers: adminHeaders(), body: { brandmark: { type: 'html', html: '' } } })
    expect(res).toMatchObject({ status: 400 })
    expect(writeBrandingJson).not.toHaveBeenCalled()
  })

  it('PUT blocks cross-site requests', async () => {
    const res = await run({ method: 'PUT', headers: { ...adminHeaders(), origin: 'https://evil.example' }, body: {} })
    expect(res).toMatchObject({ status: 403 })
    expect(writeBrandingJson).not.toHaveBeenCalled()
  })

  it('PUT requires the admin mutation header', async () => {
    const headers = adminHeaders()
    delete headers['x-cv-admin']
    expect((await run({ method: 'PUT', headers, body: {} })).status).toBeGreaterThanOrEqual(400)
    expect(writeBrandingJson).not.toHaveBeenCalled()
  })

  it('PUT requires a JSON content type', async () => {
    const res = await run({ method: 'PUT', headers: { ...adminHeaders(), 'content-type': 'text/plain' }, body: {} })
    expect(res).toMatchObject({ status: 415 })
  })

  it('rejects other methods', async () => {
    expect(await run({ method: 'DELETE', headers: adminHeaders() })).toMatchObject({ status: 405 })
  })
})
