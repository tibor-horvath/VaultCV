import { describe, expect, it } from 'vitest'
import {
  buildPhotoSrc,
  inferLinkKind,
  inferProjectLinkLabelKind,
  isCrossOriginImageUrl,
  parseBasicsHeadline,
} from './cvPresentation'

describe('buildPhotoSrc', () => {
  it('returns photoUrl when set', () => {
    expect(buildPhotoSrc({ name: 'A', photoUrl: 'https://img' })).toBe('https://img')
  })

  it('returns data URL when photoUrl missing', () => {
    const src = buildPhotoSrc({ name: 'A' })
    expect(src.startsWith('data:image/svg+xml')).toBe(true)
  })
})

describe('isCrossOriginImageUrl', () => {
  it('is true for http(s) and protocol-relative URLs', () => {
    expect(isCrossOriginImageUrl('https://x.blob.core.windows.net/p.jpg')).toBe(true)
    expect(isCrossOriginImageUrl('http://example.com/x.png')).toBe(true)
    expect(isCrossOriginImageUrl('//cdn.example/x.png')).toBe(true)
  })

  it('is false for data URLs and relative paths', () => {
    expect(isCrossOriginImageUrl('data:image/svg+xml;base64,xx')).toBe(false)
    expect(isCrossOriginImageUrl('/assets/photo.jpg')).toBe(false)
  })

  it('is false for null or undefined', () => {
    expect(isCrossOriginImageUrl(undefined)).toBe(false)
    expect(isCrossOriginImageUrl(null)).toBe(false)
  })
})

describe('parseBasicsHeadline', () => {
  it('returns empty role and null chip for blank', () => {
    expect(parseBasicsHeadline('   ')).toEqual({ role: '', chip: null })
  })

  it('treats single segment as role only', () => {
    expect(parseBasicsHeadline('Engineer')).toEqual({ role: 'Engineer', chip: null })
  })

  it('splits on middle dot', () => {
    expect(parseBasicsHeadline('Role · React · Azure')).toEqual({
      role: 'Role',
      chip: 'React · Azure',
    })
  })

  it('handles undefined headline', () => {
    expect(parseBasicsHeadline(undefined)).toEqual({ role: '', chip: null })
  })
})

describe('inferLinkKind', () => {
  it('detects github from label', () => {
    expect(inferLinkKind({ label: 'My GitHub', url: 'https://x' })).toBe('github')
  })

  it('detects linkedin from label', () => {
    expect(inferLinkKind({ label: 'LinkedIn profile', url: 'https://x' })).toBe('linkedin')
  })

  it('detects from hostname', () => {
    expect(inferLinkKind({ label: 'Repo', url: 'https://github.com/u/r' })).toBe('github')
    expect(inferLinkKind({ label: 'Me', url: 'https://www.linkedin.com/in/x' })).toBe('linkedin')
  })

  it('returns other for unknown', () => {
    expect(inferLinkKind({ label: 'Blog', url: 'https://blog.example' })).toBe('other')
  })

  it('detects youtube and email links', () => {
    expect(inferLinkKind({ label: 'YouTube', url: 'https://youtube.com/@me' })).toBe('youtube')
    expect(inferLinkKind({ label: 'Email', url: 'mailto:me@example.com' })).toBe('email')
  })
})

describe('inferProjectLinkLabelKind', () => {
  it('maps github and web labels', () => {
    expect(inferProjectLinkLabelKind({ label: 'github', url: 'x' })).toBe('github')
    expect(inferProjectLinkLabelKind({ label: 'WEB', url: 'x' })).toBe('web')
  })

  it('maps extended project labels', () => {
    expect(inferProjectLinkLabelKind({ label: 'docs', url: 'x' })).toBe('docs')
    expect(inferProjectLinkLabelKind({ label: 'video', url: 'x' })).toBe('video')
    expect(inferProjectLinkLabelKind({ label: 'case-study', url: 'x' })).toBe('case-study')
    expect(inferProjectLinkLabelKind({ label: 'gitlab', url: 'x' })).toBe('gitlab')
  })

  it('returns other otherwise', () => {
    expect(inferProjectLinkLabelKind({ label: 'repository', url: 'x' })).toBe('other')
  })
})
