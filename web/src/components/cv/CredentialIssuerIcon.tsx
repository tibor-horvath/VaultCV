import { Languages, ShieldCheck } from 'lucide-react'
import type { CvCredentialIssuer } from '../../types/cv'
import { SiGoogleIcon } from '../icons/SimpleBrandIcons'

function MicrosoftMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.9" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.85" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

function AwsMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path
        fill="currentColor"
        d="M4.25 16.6c2.4 1.76 5.2 2.65 8.05 2.65 3.2 0 6.2-1.1 8.45-2.98.26-.2.03-.62-.29-.45-2.44 1.27-5.3 1.95-8.15 1.95-2.6 0-5.2-.64-7.57-1.87-.34-.18-.66.24-.49.7ZM19.16 15.64c-.33-.44-2.17-.2-3 .07-.25.08-.29-.19-.06-.35 1.47-1.03 3.89-.73 4.17-.38.27.35-.07 2.77-1.44 3.91-.21.17-.41.08-.32-.15.29-.76.92-2.44.65-3.1Z"
      />
      <path
        fill="currentColor"
        d="M7.34 9.58c.14-.19.38-.31.63-.31h2.03c.24 0 .44.12.53.33l3.16 7.53c.07.18.02.38-.12.51l-1.03.96c-.15.14-.38.14-.53.02l-.83-.73a.383.383 0 0 1-.12-.18l-.65-1.58H7.74l-.6 1.45c-.06.16-.22.26-.39.26H5.3c-.31 0-.51-.33-.38-.62L7.34 9.58Zm1.02 2.17-.9 2.17h1.84l-.94-2.17Z"
        opacity="0.9"
      />
    </svg>
  )
}

export function CredentialIssuerIcon({ issuer, className }: { issuer: CvCredentialIssuer; className?: string }) {
  const cls = className ?? 'h-4 w-4 opacity-80'
  if (issuer === 'microsoft') return <MicrosoftMark className={cls} />
  if (issuer === 'aws') return <AwsMark className={cls} />
  if (issuer === 'google') return <SiGoogleIcon className={cls} aria-hidden="true" focusable="false" />
  if (issuer === 'language') return <Languages className={cls} />
  return <ShieldCheck className={cls} />
}
