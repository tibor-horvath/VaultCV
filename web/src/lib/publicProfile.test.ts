import { describe, expect, it } from 'vitest'
import { normalizeCvDataFromPublicPayload } from './publicProfile'

describe('normalizeCvDataFromPublicPayload', () => {
  it('returns empty object for non-object input', () => {
    expect(normalizeCvDataFromPublicPayload(null)).toEqual({})
    expect(normalizeCvDataFromPublicPayload(undefined)).toEqual({})
    expect(normalizeCvDataFromPublicPayload('x')).toEqual({})
  })

  it('accepts CvData-shaped payload and trims basics fields', () => {
    expect(
      normalizeCvDataFromPublicPayload({
        locale: ' en ',
        basics: { name: '  Ada  ', headline: ' Engineer ', location: ' London ', summary: ' Bio ' },
        links: [{ label: 'Ok', url: 'https://a.test' }, { label: 'Bad', url: 'ftp://x' }],
        skills: ['  a ', 'b', '', 1],
      }),
    ).toMatchObject({
      locale: 'en',
      basics: { name: 'Ada', headline: 'Engineer', location: 'London', summary: 'Bio' },
      links: [{ label: 'Ok', url: 'https://a.test' }],
      skills: ['a', 'b'],
    })
  })
})
