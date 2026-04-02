import type { ReactNode } from 'react'
import { PageHeader } from '../components/PageHeader'
import { useI18n } from '../lib/i18n'

type AdminPageHeaderProps = {
  title: string
  icon: ReactNode
  signedInEmail?: string
  actions: ReactNode
  headingLevel?: 'h1' | 'h2' | 'h3'
}

export function AdminPageHeader(props: AdminPageHeaderProps) {
  const { title, icon, signedInEmail, actions, headingLevel = 'h1' } = props
  const { t } = useI18n()

  const subtitleContent = signedInEmail ? (
    <>
      {t('adminSignedInAsPrefix')} <span className="font-mono">{signedInEmail}</span>
    </>
  ) : undefined

  return (
    <PageHeader
      title={title}
      icon={icon}
      subtitle={subtitleContent}
      actions={actions}
      headingLevel={headingLevel}
    />
  )
}

