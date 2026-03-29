import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveInitialTheme, resolveInitialThemeForMode } from './themePreference'

function mockMatchMedia(matchesDark: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: matchesDark && query.includes('prefers-color-scheme: dark'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('resolveInitialTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    mockMatchMedia(false)
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('uses stored theme when set', () => {
    localStorage.setItem('cv_theme', 'dark')
    mockMatchMedia(false)
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('falls back to system dark when no storage', () => {
    mockMatchMedia(true)
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('falls back to light when system not dark', () => {
    expect(resolveInitialTheme()).toBe('light')
  })
})

describe('resolveInitialThemeForMode', () => {
  beforeEach(() => {
    localStorage.clear()
    mockMatchMedia(false)
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('delegates to resolveInitialTheme when not mock', () => {
    localStorage.setItem('cv_theme', 'light')
    mockMatchMedia(true)
    expect(resolveInitialThemeForMode(false)).toBe('light')
  })

  it('returns light or dark randomly in mock mode', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(resolveInitialThemeForMode(true)).toBe('light')
    spy.mockReturnValue(0.9)
    expect(resolveInitialThemeForMode(true)).toBe('dark')
    spy.mockRestore()
  })
})
