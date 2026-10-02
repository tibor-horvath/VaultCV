import { describe, expect, it } from 'vitest'
import { PRINT_SECTION_ORDER, SECTION_KEYS, normalizePrintSectionOrder } from './sectionOrder'

describe('normalizePrintSectionOrder', () => {
  it('puts experience first when the profile has no order of its own', () => {
    expect(normalizePrintSectionOrder(undefined)).toEqual(PRINT_SECTION_ORDER)
    expect(normalizePrintSectionOrder([])).toEqual(PRINT_SECTION_ORDER)
    expect(PRINT_SECTION_ORDER[0]).toBe('experience')
  })

  it('respects an explicit profile order', () => {
    const order = normalizePrintSectionOrder(['credentials', 'experience'])
    expect(order.slice(0, 2)).toEqual(['credentials', 'experience'])
    expect(order).toHaveLength(SECTION_KEYS.length)
  })

  it('covers every section exactly once', () => {
    expect([...PRINT_SECTION_ORDER].sort()).toEqual([...SECTION_KEYS].sort())
  })
})
