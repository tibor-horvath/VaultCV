import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './index'

vi.mock('../lib/profileBlobStore', () => {
  return {
    readProfileImage: vi.fn(async () => null),
    readProfileJsonV2: vi.fn(async () => ''),
  }
})

import { readProfileImage, readProfileJsonV2 } from '../lib/profileBlobStore'

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

describe('/api/public-profile/image', () => {
  it('returns 500 when CV_PROFILE_SLUG is not configured', async () => {
    process.env.CV_PROFILE_SLUG = ''
    const context: { res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {}

    await handler(context, {})

    expect(context.res).toMatchObject({
      status: 500,
      body: { error: 'Server not configured.' },
    })
  })

  it('returns 404 when public profile does not have photoUrl', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('{"basics":{"name":"Jane"}}')

    const context: { res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {}

    await handler(context, {})

    expect(readProfileJsonV2).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'public', locale: 'en', slugFromName: 'john-doe' }),
    )
    expect(context.res).toMatchObject({
      status: 404,
      body: { error: 'No profile image found.' },
    })
  })

  it('returns 404 when public profile is empty', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('')

    const context: { res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {}

    await handler(context, {})

    expect(context.res).toMatchObject({
      status: 404,
      body: { error: 'No profile image found.' },
    })
  })

  it('returns image when public profile has photoUrl and image exists', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const imageBuffer = Buffer.from('fake-image-data')
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      '{"basics":{"name":"Jane","photoUrl":"/api/public-profile/image"}}',
    )
    ;(readProfileImage as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      buffer: imageBuffer,
      contentType: 'image/jpeg',
    })

    const context: { res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {}

    await handler(context, {})

    expect(context.res).toMatchObject({
      status: 200,
      headers: {
        'content-type': 'image/jpeg',
        'content-length': String(imageBuffer.byteLength),
      },
    })
    expect((context.res as any).body).toBe(imageBuffer)
  })

  it('returns 404 when public profile has photoUrl but no image blob exists', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      '{"basics":{"name":"Jane","photoUrl":"/api/public-profile/image"}}',
    )
    ;(readProfileImage as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

    const context: { res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {}

    await handler(context, {})

    expect(context.res).toMatchObject({
      status: 404,
      body: { error: 'No profile image found.' },
    })
  })
})
