import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

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
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    cancelButtonRef.current?.focus()
  }, [open])

  return (
    <>
      <button type="button" ref={triggerRef} onClick={() => setOpen(true)} className={className}>
        {icon ? <span className="inline-flex items-center">{icon}</span> : null}
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]"
          onMouseDown={(event) => {
            if (event.target !== event.currentTarget) return
            setOpen(false)
            triggerRef.current?.focus()
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={confirmDescription ? descriptionId : undefined}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                setOpen(false)
                triggerRef.current?.focus()
                return
              }
              if (event.key !== 'Tab') return
              const focusables = [cancelButtonRef.current, confirmButtonRef.current].filter(Boolean) as HTMLButtonElement[]
              if (!focusables.length) return
              const currentIndex = focusables.indexOf(document.activeElement as HTMLButtonElement)
              const first = focusables[0]
              const last = focusables[focusables.length - 1]
              if (event.shiftKey) {
                if (document.activeElement === first || currentIndex === -1) {
                  event.preventDefault()
                  last.focus()
                }
                return
              }
              if (document.activeElement === last || currentIndex === -1) {
                event.preventDefault()
                first.focus()
              }
            }}
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
                onClick={() => {
                  setOpen(false)
                  triggerRef.current?.focus()
                }}
                ref={cancelButtonRef}
                className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900/60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                ref={confirmButtonRef}
                onClick={() => {
                  onConfirm()
                  setOpen(false)
                  triggerRef.current?.focus()
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

