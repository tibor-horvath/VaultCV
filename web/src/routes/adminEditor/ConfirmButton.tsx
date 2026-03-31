import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useId, useState } from 'react'

export function ConfirmButton(props: {
  label: string
  className: string
  icon?: ReactNode
  confirmTitle: string
  confirmDescription?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmClassName?: string
  onConfirm: () => void
}) {
  const {
    label,
    className,
    icon,
    confirmTitle,
    confirmDescription,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmClassName,
    onConfirm,
  } = props
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const descriptionId = useId()

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {icon ? <span className="inline-flex items-center">{icon}</span> : null}
        {label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close confirmation dialog"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={confirmDescription ? descriptionId : undefined}
            className="relative w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-950"
          >
            <div id={titleId} className="text-sm font-semibold text-slate-900 dark:text-white">
              <span className="inline-flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                {confirmTitle}
              </span>
            </div>
            {confirmDescription ? (
              <div id={descriptionId} className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {confirmDescription}
              </div>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900/60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm()
                  setOpen(false)
                }}
                className={
                  confirmClassName ??
                  'rounded-lg border border-red-300/70 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40'
                }
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

