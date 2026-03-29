import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, getStoredTheme, setStoredTheme } from './theme'

describe('theme storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('getStoredTheme returns null when unset or invalid', () => {
    expect(getStoredTheme()).toBeNull()
    localStorage.setItem('cv_theme', 'nope')
    expect(getStoredTheme()).toBeNull()
  })

  it('round-trips light and dark', () => {
    setStoredTheme('light')
    expect(getStoredTheme()).toBe('light')
    setStoredTheme('dark')
    expect(getStoredTheme()).toBe('dark')
  })

  it('applyTheme toggles dark class', () => {
    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
