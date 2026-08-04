import { describe, expect, it } from 'vitest'
import { splitForPdfLineBreak } from './lineBreak'

describe('splitForPdfLineBreak', () => {
  it('leaves short words intact', () => {
    expect(splitForPdfLineBreak('Budapest')).toEqual(['Budapest'])
  })

  it('leaves long Hungarian and German compounds unbroken', () => {
    // These would be hyphenated mid-word by react-pdf's default callback.
    expect(splitForPdfLineBreak('együttműködés')).toEqual(['együttműködés'])
    expect(splitForPdfLineBreak('Softwareentwickler')).toEqual(['Softwareentwickler'])
  })

  it('breaks long URLs after punctuation, keeping the delimiter', () => {
    const parts = splitForPdfLineBreak('https://github.com/tibor-horvath/VaultCV')
    expect(parts.length).toBeGreaterThan(1)
    expect(parts.join('')).toBe('https://github.com/tibor-horvath/VaultCV')
    expect(parts[0]).toBe('https:')
    // Every break lands immediately after a delimiter, never mid-token.
    for (const part of parts.slice(0, -1)) {
      expect('/-_.?&=:@+~%#').toContain(part.at(-1))
    }
  })

  it('hard-chunks a single unbroken run so it cannot overflow the line', () => {
    const long = 'a'.repeat(200)
    const parts = splitForPdfLineBreak(long)
    expect(parts.join('')).toBe(long)
    expect(Math.max(...parts.map((p) => p.length))).toBeLessThanOrEqual(32)
  })

  it('is lossless for every input', () => {
    for (const input of ['x', 'https://a.b/c?d=e&f=g', 'ő'.repeat(50), 'word-with-hyphens-and-more-text']) {
      expect(splitForPdfLineBreak(input).join('')).toBe(input)
    }
  })
})
