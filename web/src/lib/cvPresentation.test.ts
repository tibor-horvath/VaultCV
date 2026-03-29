import { describe, expect, it } from 'vitest'
import {
  buildPhotoSrc,
  inferLinkKind,
  inferProjectLinkLabelKind,
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
})

describe('inferProjectLinkLabelKind', () => {
  it('maps github and web labels', () => {
    expect(inferProjectLinkLabelKind({ label: 'github', url: 'x' })).toBe('github')
    expect(inferProjectLinkLabelKind({ label: 'WEB', url: 'x' })).toBe('web')
  })

  it('returns other otherwise', () => {
    expect(inferProjectLinkLabelKind({ label: 'docs', url: 'x' })).toBe('other')
  })
})
