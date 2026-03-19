import { useEffect, useState } from 'react'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import { applyTheme, getStoredTheme, setStoredTheme, type ThemePreference } from '../lib/theme'

function resolveInitialTheme(): ThemePreference {
  const stored = getStoredTheme()
  const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return stored ?? (systemPrefersDark ? 'dark' : 'light')
}

export function AppShell() {
  const [theme] = useState<ThemePreference>(() => {
    const isMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_CV === '1'
    if (isMock) return Math.random() < 0.5 ? 'light' : 'dark'
    return resolveInitialTheme()
  })

  useEffect(() => {
    applyTheme(theme)
    setStoredTheme(theme)
  }, [theme])

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[radial-gradient(90rem_55rem_at_15%_-10%,rgba(56,189,248,0.12),transparent),radial-gradient(70rem_42rem_at_95%_5%,rgba(139,92,246,0.14),transparent),linear-gradient(to_bottom_right,#f8fbff,#f2f6fd_45%,#eef3ff)] dark:bg-[radial-gradient(80rem_48rem_at_10%_-5%,rgba(56,189,248,0.08),transparent),radial-gradient(70rem_44rem_at_100%_0%,rgba(139,92,246,0.09),transparent),linear-gradient(to_bottom_right,#020617,#060b16_45%,#090f1f)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.07)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)]" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col px-4 pb-14 pt-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  )
}

