import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './index'

declare const process: { env: Record<string, string | undefined> }

vi.mock('../lib/profileBlobStore', () => {
  return {
    readProfileJsonV2: vi.fn(async () => ''),
  }
})

import { readProfileJsonV2 } from '../lib/profileBlobStore'

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

describe('/api/public-profile', () => {
  it('returns 404 when CV_PROFILE_SLUG is not configured', async () => {
    process.env.CV_PROFILE_SLUG = ''
    const context: { log: (...args: unknown[]) => void; res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {
      log: vi.fn() as any,
    }

    await handler(context, { headers: { 'accept-language': 'en' } })

    expect(context.res).toMatchObject({
      status: 404,
      body: { error: 'CV_PROFILE_SLUG is not configured.' },
    })
  })

  it('returns V2 blob payload when CV_PROFILE_SLUG is configured and blob exists', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('{"basics":{"name":"Jane"}}')

    const context: { log: (...args: unknown[]) => void; res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {
      log: vi.fn() as any,
    }
    await handler(context, { headers: { 'accept-language': 'en' } })

    expect(readProfileJsonV2).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'public', locale: 'en', slugFromName: 'john-doe', legacyFallback: false }),
    )
    expect(context.res).toMatchObject({
      status: 200,
      body: { basics: { name: 'Jane' }, locale: 'en' },
    })
    expect(context.log).toHaveBeenCalledWith(
      'Loaded PUBLIC_PROFILE payload',
      expect.objectContaining({ payloadSource: 'blob_v2' }),
    )
  })

  it('returns empty payload when V2 blob is empty', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('')

    const context: { log: (...args: unknown[]) => void; res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {
      log: vi.fn() as any,
    }
    await handler(context, { headers: { 'accept-language': 'en' } })

    expect(context.res).toMatchObject({
      status: 200,
      body: { locale: 'en' },
    })
  })
})
