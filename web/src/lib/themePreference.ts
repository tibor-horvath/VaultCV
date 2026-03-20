import { getStoredTheme, type ThemePreference } from './theme'

export function resolveInitialTheme(): ThemePreference {
  const stored = getStoredTheme()
  const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return stored ?? (systemPrefersDark ? 'dark' : 'light')
}

export function resolveInitialThemeForMode(isMockMode: boolean): ThemePreference {
  if (isMockMode) return Math.random() < 0.5 ? 'light' : 'dark'
  return resolveInitialTheme()
}
