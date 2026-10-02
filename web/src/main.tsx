import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AppViewProvider } from './lib/appView'
import { LocaleProvider } from './lib/i18n'
import { installMockAdminFetch } from './lib/mockAdminFetch'
import { SiteBrandingProvider } from './lib/siteBrandingContext'
import { ThemeProvider } from './lib/themeContext'

if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_CV === '1') installMockAdminFetch()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <AppViewProvider>
        <ThemeProvider>
          <SiteBrandingProvider>
            <App />
          </SiteBrandingProvider>
        </ThemeProvider>
      </AppViewProvider>
    </LocaleProvider>
  </StrictMode>,
)
