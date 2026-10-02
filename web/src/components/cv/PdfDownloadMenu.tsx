import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ChevronDown, Download, FileDown, X } from 'lucide-react'
import { useI18n } from '../../lib/i18n'
import type { MessageKey } from '../../i18n/messages'
import { PDF_VARIANTS, type PdfVariant } from '../../lib/pdfVariant'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'

const VARIANT_COPY: Record<PdfVariant, { title: MessageKey; hint: MessageKey }> = {
  modern: { title: 'pdfVariantModern', hint: 'pdfVariantModernHint' },
  print: { title: 'pdfVariantPrint', hint: 'pdfVariantPrintHint' },
}

/**
 * Miniatures of the two layouts. They depict paper, so they keep paper colors in dark mode.
 * Drawn at phone size; the desktop cards scale them up rather than redraw them.
 */
function ModernThumb() {
  return (
    <span className="flex h-[84px] w-16 shrink-0 overflow-hidden rounded-md border border-[#D5D8E6] bg-white" aria-hidden="true">
      <span className="flex w-[21px] flex-col items-center gap-1 bg-[#0B1020] pt-[7px]">
        <span className="h-2.5 w-2.5 rounded-full bg-[#4F46E5]" />
        <span className="h-0.5 w-[13px] bg-[#5A6178]" />
        <span className="h-0.5 w-[13px] bg-[#5A6178]" />
        <span className="h-0.5 w-[13px] bg-[#5A6178]" />
      </span>
      <span className="flex flex-1 flex-col gap-1 px-1.5 py-2">
        <span className="h-1 w-[26px] bg-[#0B1020]" />
        <span className="h-0.5 w-[18px] bg-[#4F46E5]" />
        <span className="mt-1 h-0.5 bg-[#D5D8E6]" />
        <span className="h-0.5 bg-[#D5D8E6]" />
        <span className="h-0.5 w-[22px] bg-[#D5D8E6]" />
        <span className="mt-1 h-2.5 rounded-sm bg-[#EEF0FF]" />
      </span>
    </span>
  )
}

function PrintThumb() {
  return (
    <span className="flex h-[84px] w-16 shrink-0 flex-col gap-1 rounded-md border border-[#D5D8E6] bg-white px-[7px] py-2" aria-hidden="true">
      <span className="flex items-center gap-1">
        <span className="h-[9px] w-[9px] bg-[#D4D4D4]" />
        <span className="h-1 w-6 bg-[#111111]" />
      </span>
      <span className="mt-[3px] h-px bg-[#D4D4D4]" />
      {[true, false, true, false].map((labelled, i) => (
        <span key={i} className={cn('flex gap-1', i === 2 && 'mt-[3px]')}>
          <span className={cn('h-0.5 w-3', labelled && 'bg-[#1F4A7A]')} />
          <span className="h-0.5 flex-1 bg-[#9A9A9A]" />
        </span>
      ))}
    </span>
  )
}

/**
 * The CV's download control: one button that opens a chooser of the two layouts, each shown as a
 * page preview. Picking a layout downloads it straight away, so there is no separate "select"
 * step, and desktop (popover of side-by-side cards) and phones (bottom sheet of rows) behave the
 * same. The layout downloaded last is tagged "Last used" and gets focus when the chooser opens.
 */
export function PdfDownloadMenu({
  busy,
  selected,
  onSelect,
  onDownload,
}: {
  busy: boolean
  selected: PdfVariant
  onSelect: (variant: PdfVariant) => void
  onDownload: (variant: PdfVariant) => void
}) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const menuId = useId()
  const label = busy ? t('generatingPdf') : t('downloadPdf')

  function focusTrigger() {
    rootRef.current?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')?.focus()
  }

  useEffect(() => {
    if (!isOpen) return
    const index = Math.max(0, PDF_VARIANTS.indexOf(selected))
    window.requestAnimationFrame(() => itemRefs.current[index]?.focus())

    function onPointerDown(event: PointerEvent) {
      const target = event.target
      if (target instanceof Node && rootRef.current && !rootRef.current.contains(target)) setIsOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        focusTrigger()
      }
      if (event.key === 'Tab') setIsOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, selected])

  function choose(variant: PdfVariant) {
    setIsOpen(false)
    onSelect(variant)
    onDownload(variant)
    focusTrigger()
  }

  function onMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const items = itemRefs.current.filter((el): el is HTMLButtonElement => el != null)
    const current = items.indexOf(document.activeElement as HTMLButtonElement)
    const count = items.length
    let next: number | null = null
    // Cards sit side by side on desktop and stacked on phones; both axes move between them.
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (current + 1) % count
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (current - 1 + count) % count
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = count - 1
    if (next == null) return
    event.preventDefault()
    items[next]?.focus()
  }

  return (
    <div ref={rootRef} className="relative flex">
      <Button
        variant="primary"
        size="lg"
        onClick={() => setIsOpen((open) => !open)}
        busy={busy}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={label}
        iconLeft={<FileDown className="h-4 w-4 shrink-0" aria-hidden="true" />}
        iconRight={
          <ChevronDown
            className={cn('-mr-1 h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        }
        className={cn('max-sm:px-4', isOpen && 'bg-accent-hover ring-2 ring-accent/30')}
      >
        <span className="sm:hidden" aria-hidden="true">
          PDF
        </span>
        <span className="hidden sm:inline" aria-hidden="true">
          {label}
        </span>
      </Button>

      {isOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/45 sm:hidden" aria-hidden="true" onClick={() => setIsOpen(false)} />
          <div
            id={menuId}
            role="menu"
            aria-label={t('pdfFormatMenuLabel')}
            onKeyDown={onMenuKeyDown}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 rounded-t-2xl border border-line bg-surface p-4 pb-7 shadow-overlay',
              'sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[30rem] sm:rounded-card sm:pb-4',
              'motion-safe:animate-fade-in sm:motion-safe:animate-slide-down',
            )}
          >
            <div className="mx-auto -mt-1.5 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-lg font-bold text-ink sm:hidden">{t('downloadPdf')}</span>
                <span className="text-[13px] text-ink-muted">{t('pdfChooserHint')}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t('pdfFormatMenuClose')}
                className="vc-focusable inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted sm:hidden"
              >
                <X className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-2 sm:gap-3">
              {PDF_VARIANTS.map((variant, index) => {
                const isLastUsed = variant === selected
                const copy = VARIANT_COPY[variant]
                return (
                  <button
                    key={variant}
                    ref={(node) => {
                      itemRefs.current[index] = node
                    }}
                    type="button"
                    role="menuitem"
                    onClick={() => choose(variant)}
                    className={cn(
                      'vc-focusable group flex w-full items-center gap-3.5 rounded-field border bg-surface p-3 text-left',
                      'sm:flex-col sm:items-stretch sm:gap-0 sm:overflow-hidden sm:p-0',
                      isLastUsed
                        ? 'border-accent ring-1 ring-accent'
                        : 'border-line hover:border-line-strong hover:bg-surface-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'flex shrink-0 sm:h-[150px] sm:items-end sm:justify-center',
                        isLastUsed ? 'sm:bg-accent-soft' : 'sm:bg-surface-muted',
                      )}
                    >
                      <span className="sm:mb-[-1px] sm:origin-bottom sm:scale-[1.6]">
                        {variant === 'modern' ? <ModernThumb /> : <PrintThumb />}
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1 sm:px-3.5 sm:pb-3.5 sm:pt-3">
                      <span className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-ink">{t(copy.title)}</span>
                        {isLastUsed ? (
                          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-soft-ink">
                            {t('pdfLastUsed')}
                          </span>
                        ) : null}
                        <Download
                          className={cn(
                            'ml-auto hidden h-[18px] w-[18px] shrink-0 sm:block',
                            isLastUsed ? 'text-accent' : 'text-ink-subtle group-hover:text-ink',
                          )}
                          aria-hidden="true"
                        />
                      </span>
                      <span className="text-[13px] leading-snug text-ink-muted">{t(copy.hint)}</span>
                    </span>
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:hidden',
                        isLastUsed ? 'bg-accent text-accent-ink' : 'border border-line-strong bg-surface-muted text-ink',
                      )}
                      aria-hidden="true"
                    >
                      <Download className="h-[18px] w-[18px]" />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
