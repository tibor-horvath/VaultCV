import { Globe } from 'lucide-react'
import {
  CZ,
  DE,
  ES,
  FR,
  GB,
  HU,
  IT,
  PL,
  PT,
  SK,
} from 'country-flag-icons/react/3x2'

const flagComponentsByCountryCode = {
  GB,
  HU,
  CZ,
  DE,
  FR,
  ES,
  IT,
  PT,
  PL,
  SK,
} as const

export function LocaleFlag({ countryCode, className }: { countryCode?: string; className?: string }) {
  const Flag =
    countryCode && countryCode in flagComponentsByCountryCode
      ? flagComponentsByCountryCode[countryCode as keyof typeof flagComponentsByCountryCode]
      : null

  if (Flag) {
    return <Flag aria-hidden="true" className={className ?? 'h-3.5 w-5 rounded-sm object-cover'} />
  }

  return <Globe aria-hidden="true" className={className ?? 'h-3.5 w-5 opacity-70'} />
}