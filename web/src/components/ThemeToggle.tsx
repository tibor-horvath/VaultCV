import { Moon, Sun } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { useTheme } from '../lib/themeContext'
import { IconButton } from './ui/IconButton'

/**
 * Light/dark switch. Icon-only: the label was never information the reader needed, and dropping it
 * keeps the CV toolbar from turning into a row of competing words.
 */
export function ThemeToggle({ variant = 'outline' }: { variant?: 'ghost' | 'outline' }) {
  const { t } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <IconButton
      label={isDark ? t('themeSwitchToLight') : t('themeSwitchToDark')}
      onClick={toggleTheme}
      variant={variant}
      aria-pressed={isDark}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </IconButton>
  )
}
