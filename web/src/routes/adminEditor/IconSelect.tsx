import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type IconSelectOption = {
  value: string
  label: string
  icon?: ReactNode
}

export function IconSelect(props: {
  value: string
  onChange: (value: string) => void
  options: IconSelectOption[]
  placeholder?: string
  ariaLabel: string
}) {
  const { value, onChange, options, placeholder = 'Select...', ariaLabel } = props
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selected = options.find((o) => o.value === value) ?? null
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value))

  useEffect(() => {
    if (!open) return
    setActiveIndex(selectedIndex)
  }, [open, selectedIndex])

  useEffect(() => {
    if (!open) return
    const node = optionRefs.current[activeIndex]
    node?.focus()
  }, [open, activeIndex])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const el = rootRef.current
      if (!el) return
      if (el.contains(event.target as Node)) return
      setOpen(false)
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
            setActiveIndex((idx) => Math.min(options.length - 1, idx + 1))
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
            setActiveIndex((idx) => Math.max(0, idx - 1))
          } else if (event.key === 'Enter' || event.key === ' ') {
            if (!open) {
              event.preventDefault()
              setOpen(true)
            }
          } else if (event.key === 'Home') {
            event.preventDefault()
            setOpen(true)
            setActiveIndex(0)
          } else if (event.key === 'End') {
            event.preventDefault()
            setOpen(true)
            setActiveIndex(options.length - 1)
          }
        }}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      >
        <span className="inline-flex items-center gap-2 truncate">
          {selected?.icon ? <span className="shrink-0">{selected.icon}</span> : null}
          <span className={selected ? '' : 'text-slate-400 dark:text-slate-500'}>{selected?.label ?? placeholder}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={open ? `icon-select-option-${activeIndex}` : undefined}
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-950"
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              id={`icon-select-option-${index}`}
              ref={(node) => {
                optionRefs.current[index] = node
              }}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
                triggerRef.current?.focus()
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  setActiveIndex(Math.min(options.length - 1, index + 1))
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  setActiveIndex(Math.max(0, index - 1))
                } else if (event.key === 'Home') {
                  event.preventDefault()
                  setActiveIndex(0)
                } else if (event.key === 'End') {
                  event.preventDefault()
                  setActiveIndex(options.length - 1)
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  setOpen(false)
                  triggerRef.current?.focus()
                } else if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onChange(option.value)
                  setOpen(false)
                  triggerRef.current?.focus()
                } else if (event.key === 'Tab') {
                  setOpen(false)
                }
              }}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                option.value === value
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900/70'
              }`}
            >
              {option.icon ? <span className="shrink-0">{option.icon}</span> : null}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

