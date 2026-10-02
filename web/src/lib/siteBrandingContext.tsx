/* eslint-disable react-refresh/only-export-components -- module exports provider + hook */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchSiteBranding, readCachedBranding, writeCachedBranding, type SiteBranding } from './siteBranding'

type SiteBrandingApi = {
  branding: SiteBranding
  /** Swaps in freshly saved branding, so the admin sees it without waiting for the public cache. */
  setBranding: (branding: SiteBranding) => void
}

// A default instead of a throw: pages rendered outside the provider (tests) simply get no branding.
const SiteBrandingContext = createContext<SiteBrandingApi>({ branding: {}, setBranding: () => {} })

const isMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_CV === '1'

export function SiteBrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBrandingState] = useState<SiteBranding>(() => readCachedBranding())

  const setBranding = useCallback((next: SiteBranding) => {
    setBrandingState(next)
    writeCachedBranding(next)
  }, [])

  useEffect(() => {
    // Mock mode has no API behind it.
    if (isMock) return
    let cancelled = false
    void fetchSiteBranding().then((fresh) => {
      if (!cancelled && fresh) setBranding(fresh)
    })
    return () => {
      cancelled = true
    }
  }, [setBranding])

  const value = useMemo(() => ({ branding, setBranding }), [branding, setBranding])
  return <SiteBrandingContext.Provider value={value}>{children}</SiteBrandingContext.Provider>
}

export function useSiteBranding() {
  return useContext(SiteBrandingContext)
}
