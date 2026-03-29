import { describe, expect, it } from 'vitest'
import { highlightChildKey, stableEducationKey, stableExperienceKey } from './cvKeys'

describe('stableExperienceKey', () => {
  it('returns id when present', () => {
    expect(
      stableExperienceKey({
        id: 'x',
        company: 'A',
        role: 'B',
        start: '2020',
        highlights: [],
      }),
    ).toBe('x')
  })

  it('builds deterministic key when id missing', () => {
    const a = stableExperienceKey({
      company: 'Co',
      role: 'Dev',
      start: '2020',
      end: '2021',
      location: 'Remote',
      highlights: [],
    })
    const b = stableExperienceKey({
      company: 'Co',
      role: 'Dev',
      start: '2020',
      end: '2021',
      location: 'Remote',
      highlights: [],
    })
    expect(a).toBe(b)
    expect(a).toContain('Co')
  })
})

describe('stableEducationKey', () => {
  it('returns id when present', () => {
    expect(
      stableEducationKey({
        id: 'edu-1',
        school: 'S',
        program: 'P',
      }),
    ).toBe('edu-1')
  })

  it('builds deterministic key when id missing', () => {
    const key = stableEducationKey({
      school: 'Uni',
      degree: 'BSc',
      field: 'CS',
      program: 'Undergrad',
      start: '2018',
      end: '2022',
      location: 'City',
    })
    expect(key).toContain('Uni')
  })
})

describe('highlightChildKey', () => {
  it('prefixes parent and index', () => {
    expect(highlightChildKey('row-1', 2)).toBe('row-1::h::2')
  })
})
