import type { ReactNode } from 'react'

export function AdminPageHeader(props: {
  title: string
  icon: ReactNode
  signedInEmail?: string
  actions: ReactNode
}) {
  const { title, icon, signedInEmail, actions } = props
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          {icon}
          <div className="text-lg font-semibold">{title}</div>
        </div>
        {signedInEmail ? (
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Signed in as <span className="font-mono">{signedInEmail}</span>
          </div>
        ) : null}
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">{actions}</div>
    </div>
  )
}

