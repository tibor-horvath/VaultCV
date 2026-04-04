import { beforeEach, describe, expect, it } from 'vitest'
import { sanitizeTrustedImageUrl } from '../../lib/sanitizeTrustedImageUrl'

describe('sanitizeTrustedImageUrl', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/admin/editor')
  })

  it('allows same-origin API image URLs', () => {
    expect(sanitizeTrustedImageUrl('/api/manage/profile/image?_=123')).toBe('/api/manage/profile/image?_=123')
    expect(sanitizeTrustedImageUrl(`${window.location.origin}/api/manage/profile/image`)).toBe('/api/manage/profile/image')
  })

  it('allows same-origin blob URLs created for client-side cropping', () => {
    const blobUrl = `blob:${window.location.origin}/1234-5678`
    expect(sanitizeTrustedImageUrl(blobUrl)).toBe(blobUrl)
  })

  it('rejects dangerous or off-origin image URLs', () => {
    expect(sanitizeTrustedImageUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeTrustedImageUrl('data:image/svg+xml,<svg/>')).toBeNull()
    expect(sanitizeTrustedImageUrl('https://evil.example/api/manage/profile/image')).toBeNull()
    expect(sanitizeTrustedImageUrl('/images/avatar.png')).toBeNull()
  })
})
