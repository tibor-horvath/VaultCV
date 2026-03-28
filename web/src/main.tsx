import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AppViewProvider } from './lib/appView'
import { LocaleProvider } from './lib/i18n'
import { ThemeProvider } from './lib/themeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <AppViewProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AppViewProvider>
    </LocaleProvider>
  </StrictMode>,
)
