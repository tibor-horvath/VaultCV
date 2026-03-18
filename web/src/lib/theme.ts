export type ThemePreference = 'light' | 'dark'

const STORAGE_KEY = 'cv_theme'

export function getStoredTheme(): ThemePreference | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark') return raw
    return null
  } catch {
    return null
  }
}

export function setStoredTheme(theme: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore
  }
}

export function applyTheme(theme: ThemePreference) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
}

