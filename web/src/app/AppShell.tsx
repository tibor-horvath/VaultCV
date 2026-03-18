import { useEffect, useMemo, useState } from 'react'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { applyTheme, getStoredTheme, setStoredTheme, type ThemePreference } from '../lib/theme'

export function AppShell() {
  const [theme, setTheme] = useState<ThemePreference>('light')

  useEffect(() => {
    const isMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_CV === '1'
    const stored = getStoredTheme()
    const initial: ThemePreference =
      isMock
        ? Math.random() < 0.5
          ? 'light'
          : 'dark'
        : stored ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setTheme(initial)
    applyTheme(initial)
  }, [])

  useEffect(() => {
    applyTheme(theme)
    setStoredTheme(theme)
  }, [theme])

  const toggle = useMemo(() => {
    return () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:bg-slate-900"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  )
}

