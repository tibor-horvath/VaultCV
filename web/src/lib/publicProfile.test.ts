import { describe, expect, it } from 'vitest'
import { defaultPublicData, mergePublicData, normalizePublicData, type PublicData } from './publicProfile'

describe('normalizePublicData', () => {
  it('returns empty object for non-object input', () => {
    expect(normalizePublicData(null)).toEqual({})
    expect(normalizePublicData(undefined)).toEqual({})
    expect(normalizePublicData('x')).toEqual({})
  })

  it('trims string fields', () => {
    expect(
      normalizePublicData({
        name: '  Ada  ',
        title: ' Engineer ',
        location: ' London ',
        focus: ' Cloud ',
        bio: ' Bio ',
        locale: ' en ',
      }),
    ).toMatchObject({
      name: 'Ada',
      title: 'Engineer',
      location: 'London',
      focus: 'Cloud',
      bio: 'Bio',
      locale: 'en',
    })
  })

  it('keeps only http(s) links with label and url', () => {
    expect(
      normalizePublicData({
        links: [
          { label: 'Ok', url: 'https://a.test' },
          { label: '', url: 'https://b.test' },
          { label: 'Bad', url: 'ftp://x' },
          { label: 'X', url: 'not-a-url' },
        ],
      }),
    ).toEqual({
      links: [{ label: 'Ok', url: 'https://a.test' }],
    })
  })

  it('maps tags to skills when skills absent', () => {
    expect(
      normalizePublicData({
        tags: ['  a ', 'b', '', 1],
      }),
    ).toEqual({ skills: ['a', 'b'] })
  })
})

describe('mergePublicData', () => {
  const base: PublicData = {
    ...defaultPublicData,
    name: 'Base',
    links: [{ label: 'L1', url: 'https://one.example' }],
    skills: ['s1'],
  }

  it('keeps base links and skills when patch omits them', () => {
    const merged = mergePublicData(base, { name: 'New', title: 'T' })
    expect(merged.name).toBe('New')
    expect(merged.title).toBe('T')
    expect(merged.links).toEqual(base.links)
    expect(merged.skills).toEqual(base.skills)
  })

  it('uses incoming links when defined', () => {
    const next = [{ label: 'X', url: 'https://x.example' }]
    expect(mergePublicData(base, { links: next }).links).toEqual(next)
  })
})
