import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolvePdfProfilePhoto } from './pdfImage'

function stubFetch(impl: (input: string, init?: RequestInit) => Promise<Response>) {
  const spy = vi.fn(impl)
  vi.stubGlobal('fetch', spy as unknown as typeof fetch)
  return spy
}

/**
 * jsdom never loads image data, so the real `Image` would sit until the downscale timeout fires.
 * Failing the decode immediately exercises the same path — downscale bails and the fetched data
 * URL is embedded as-is.
 */
class UndecodableImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  decoding = 'auto'
  set src(_value: string) {
    queueMicrotask(() => this.onerror?.())
  }
}

const PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo='

function pngResponse() {
  return Promise.resolve(new Response(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }), { status: 200 }))
}

describe('resolvePdfProfilePhoto', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', UndecodableImage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the session cookie when fetching the same-origin private profile image', async () => {
    const fetchSpy = stubFetch(() => pngResponse())

    await resolvePdfProfilePhoto('/api/private-profile/image')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]!
    expect(url).toBe(`${window.location.origin}/api/private-profile/image`)
    expect(init?.credentials).toBe('same-origin')
  })

  it('omits credentials for cross-origin blob storage images', async () => {
    const fetchSpy = stubFetch(() => pngResponse())

    await resolvePdfProfilePhoto('https://example.blob.core.windows.net/pics/me.png')

    const [, init] = fetchSpy.mock.calls[0]!
    expect(init?.credentials).toBe('omit')
    expect(init?.mode).toBe('cors')
  })

  it('falls back to the vector avatar when the image request fails', async () => {
    stubFetch(() => Promise.resolve(new Response('{"error":"Unauthorized"}', { status: 401 })))

    await expect(resolvePdfProfilePhoto('/api/private-profile/image')).resolves.toEqual({ kind: 'fallback' })
  })

  it('passes raster data URLs straight through and rejects the SVG placeholder', async () => {
    await expect(resolvePdfProfilePhoto(PNG_DATA_URL)).resolves.toEqual({ kind: 'image', src: PNG_DATA_URL })
    await expect(resolvePdfProfilePhoto('data:image/svg+xml;utf8,%3Csvg%2F%3E')).resolves.toEqual({ kind: 'fallback' })
  })
})
