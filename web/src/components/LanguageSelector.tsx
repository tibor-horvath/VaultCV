import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useI18n, type Locale, type LocaleOption } from '../lib/i18n'
import { LocaleFlag } from './LocaleFlag'

function LocaleRow({
  option,
  selected,
}: {
  option: LocaleOption
  selected: boolean
}) {
  return (
    <>
      <LocaleFlag countryCode={option.countryCode} />
      <span className="min-w-8 font-semibold">{option.code.toUpperCase()}</span>
      <span className="truncate">{option.label}</span>
      {selected ? <Check className="ml-auto h-3.5 w-3.5 opacity-80" aria-hidden="true" /> : null}
    </>
  )
}

export function LanguageSelector({ allowedLocales }: { allowedLocales?: readonly string[] }) {
  const { locale, localeOptions, setLocale, t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const listId = useId()

  const visibleOptions = useMemo(() => {
    if (!allowedLocales) return localeOptions
    const allowSet = new Set(allowedLocales)
    return localeOptions.filter((option) => allowSet.has(option.code))
  }, [allowedLocales, localeOptions])

  const selectedOption = useMemo(
    () => visibleOptions.find((option) => option.code === locale) ?? visibleOptions[0] ?? null,
    [locale, visibleOptions],
  )

  useEffect(() => {
    if (!allowedLocales) return
    const firstVisible = visibleOptions[0]
    if (!firstVisible) return
    if (!visibleOptions.find((option) => option.code === locale)) {
      setLocale(firstVisible.code as Locale)
    }
  }, [allowedLocales, locale, visibleOptions, setLocale])

  useEffect(() => {
    if (!isOpen) return
    const selectedIndex = visibleOptions.findIndex((option) => option.code === selectedOption?.code)
    const nextIndex = selectedIndex >= 0 ? selectedIndex : 0
    queueMicrotask(() => {
      setActiveIndex(nextIndex)
      window.requestAnimationFrame(() => {
        itemRefs.current[nextIndex]?.focus()
      })
    })
  }, [isOpen, visibleOptions, selectedOption?.code])

  useEffect(() => {
    if (!isOpen) return

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current
      if (!root) return
      const target = event.target
      if (target instanceof Node && !root.contains(target)) {
        setIsOpen(false)
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
      if (event.key === 'Tab') {
        setIsOpen(false)
      }
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onEscape)
    }
  }, [isOpen])

  if (visibleOptions.length <= 1) return null
  if (!selectedOption) return null

  function selectAt(index: number) {
    const option = visibleOptions[index]
    if (!option) return
    setLocale(option.code as Locale)
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  function onMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const count = visibleOptions.length
    if (!count) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => {
        const next = (current + 1) % count
        itemRefs.current[next]?.focus()
        return next
      })
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => {
        const next = (current - 1 + count) % count
        itemRefs.current[next]?.focus()
        return next
      })
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
      itemRefs.current[0]?.focus()
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      const next = count - 1
      setActiveIndex(next)
      itemRefs.current[next]?.focus()
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectAt(activeIndex)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('languageSelectorLabel')}
        aria-controls={listId}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex min-w-40 items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900"
      >
        <LocaleRow option={selectedOption} selected={false} />
        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          id={listId}
          role="menu"
          aria-label={t('languageSelectorLabel')}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-50 mt-2 min-w-52 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-1 shadow-lg dark:border-slate-700/80 dark:bg-slate-900"
        >
          {visibleOptions.map((option, index) => {
            const selected = option.code === selectedOption.code
            return (
              <button
                key={option.code}
                ref={(node) => {
                  itemRefs.current[index] = node
                }}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                tabIndex={index === activeIndex ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onClick={() => selectAt(index)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LocaleRow option={option} selected={selected} />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
