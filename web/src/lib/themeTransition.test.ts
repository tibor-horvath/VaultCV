import { afterEach, describe, expect, it, vi } from 'vitest'
import { startThemeTransition } from './themeTransition'

// `lib.dom` declares `startViewTransition` as always present, so reach the document through a
// structural type to make it optional and therefore deletable.
const doc = document as unknown as { startViewTransition?: (cb: () => void) => unknown }

function setViewTransition(impl: ((cb: () => void) => unknown) | undefined) {
  if (impl) {
    doc.startViewTransition = impl
  } else {
    delete doc.startViewTransition
  }
}

function setReducedMotion(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduced && query.includes('prefers-reduced-motion: reduce'),
      media: query,
    })),
  )
}

afterEach(() => {
  setViewTransition(undefined)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('startThemeTransition', () => {
  it('routes the change through a view transition when one is available', () => {
    const applyChange = vi.fn()
    const startViewTransition = vi.fn((cb: () => void) => {
      cb()
      return {}
    })
    setViewTransition(startViewTransition)
    setReducedMotion(false)

    startThemeTransition(applyChange)

    expect(startViewTransition).toHaveBeenCalledTimes(1)
    expect(applyChange).toHaveBeenCalledTimes(1)
  })

  it('applies the change directly when the API is missing', () => {
    const applyChange = vi.fn()
    setViewTransition(undefined)
    setReducedMotion(false)

    startThemeTransition(applyChange)

    expect(applyChange).toHaveBeenCalledTimes(1)
  })

  it('skips the animation when the user asked for reduced motion', () => {
    const applyChange = vi.fn()
    const startViewTransition = vi.fn()
    setViewTransition(startViewTransition)
    setReducedMotion(true)

    startThemeTransition(applyChange)

    expect(startViewTransition).not.toHaveBeenCalled()
    expect(applyChange).toHaveBeenCalledTimes(1)
  })

  it('still switches the theme when matchMedia is unavailable', () => {
    const applyChange = vi.fn()
    setViewTransition(undefined)
    vi.stubGlobal('matchMedia', undefined)

    startThemeTransition(applyChange)

    expect(applyChange).toHaveBeenCalledTimes(1)
  })
})
