import { describe, expect, it } from 'vitest'
import { sanitizePdfFileBaseName } from './pdfFileName'

describe('sanitizePdfFileBaseName', () => {
  it('preserves accented characters', () => {
    expect(sanitizePdfFileBaseName('Horváth Ákos CV')).toBe('Horváth Ákos CV')
  })

  it('preserves Hungarian double-acute characters', () => {
    expect(sanitizePdfFileBaseName('Bíró Győző CV')).toBe('Bíró Győző CV')
  })

  it('replaces forbidden filename characters', () => {
    expect(sanitizePdfFileBaseName('cv: senior/dev*lead?')).toBe('cv_ senior_dev_lead_')
  })

  it('strips control characters', () => {
    expect(sanitizePdfFileBaseName(`cv${String.fromCharCode(0)}${String.fromCharCode(31)}name`)).toBe('cvname')
  })

  it('falls back to cv when nothing usable remains', () => {
    expect(sanitizePdfFileBaseName('   ...   ')).toBe('cv')
  })
})
