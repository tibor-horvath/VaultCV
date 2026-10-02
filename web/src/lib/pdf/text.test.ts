import { describe, expect, it } from 'vitest'
import { hasText, initialsOf, joinDot } from './text'

describe('hasText', () => {
  it('is false for nullish and blank values', () => {
    expect(hasText(undefined)).toBe(false)
    expect(hasText(null)).toBe(false)
    expect(hasText('  ')).toBe(false)
    expect(hasText('x')).toBe(true)
  })
})

describe('joinDot', () => {
  it('joins trimmed, non-blank items with a middle dot', () => {
    expect(joinDot([' React ', '', null, 'Azure', undefined])).toBe('React · Azure')
    expect(joinDot([])).toBe('')
  })
})

describe('initialsOf', () => {
  it('takes the first letter of the first two words', () => {
    expect(initialsOf('John Doe')).toBe('JD')
    expect(initialsOf('  Bíró   Győző Ödön ')).toBe('BG')
    expect(initialsOf('ödön')).toBe('Ö')
    expect(initialsOf('')).toBe('')
  })
})
