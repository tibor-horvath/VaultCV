import { describe, expect, it } from 'vitest'
import { faviconHrefFromName, GENERIC_FAVICON_HREF, initialsFromName } from './favicon'

describe('initialsFromName', () => {
  it('returns empty for blank, cv, or no letters', () => {
    expect(initialsFromName('')).toBe('')
    expect(initialsFromName('cv')).toBe('')
    expect(initialsFromName('123')).toBe('')
  })

  it('uses first two letters for single word', () => {
    expect(initialsFromName('Prague')).toBe('PR')
  })

  it('uses first letter of first and last word', () => {
    expect(initialsFromName('Jane Doe')).toBe('JD')
  })

  it('skips non-letters when picking initials', () => {
    expect(initialsFromName("O'Brien Smith")).toBe('OS')
  })
})

describe('faviconHrefFromName', () => {
  it('returns generic href when initials empty', () => {
    expect(faviconHrefFromName('')).toBe(GENERIC_FAVICON_HREF)
  })

  it('embeds initials in data URL', () => {
    const href = faviconHrefFromName('Ada Lovelace')
    expect(href.startsWith('data:image/svg+xml')).toBe(true)
    expect(href).toMatch(/AL/)
  })
})
