import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { stringArrayToTextAreaLines, textAreaLinesToStringArray } from './utils'
import { useI18n } from '../../lib/i18n'

export function StringListEditor(props: {
  label: string
  items: string[]
  setItems: (items: string[]) => void
  placeholder?: string
  inputId?: string
  multilineItems?: boolean
  desktopColumns?: 2 | 3
  error?: string
  errorId?: string
}) {
  const { t } = useI18n()
  const { label, items, setItems, placeholder, inputId, multilineItems = false, desktopColumns = 2, error, errorId } = props
  const [draft, setDraft] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkText, setBulkText] = useState('')

  const normalizedItems = useMemo(() => (items ?? []).map((x) => String(x ?? '').trim()).filter(Boolean), [items])

  function addDraft() {
    const candidates = textAreaLinesToStringArray(draft.replace(/[;,]/g, '\n'))
    if (!candidates.length) return
    const merged = [...normalizedItems]
    for (const candidate of candidates) {
      if (!merged.includes(candidate)) merged.push(candidate)
    }
    setItems(merged)
    setDraft('')
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-xs font-medium text-ink-muted">
          {label}
        </label>
        <button
          type="button"
          onClick={() => {
            if (!bulkMode) setBulkText(stringArrayToTextAreaLines(normalizedItems))
            setBulkMode((v) => !v)
          }}
          className="rounded-field border border-line px-2 py-1 text-[11px] font-medium text-ink-muted hover:bg-surface-muted"
        >
          {bulkMode ? t('adminListMode') : t('adminPasteMode')}
        </button>
      </div>

      {bulkMode ? (
        <>
          <textarea
            id={inputId}
            rows={6}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            onBlur={() => setItems(textAreaLinesToStringArray(bulkText))}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="w-full rounded-field border border-line bg-surface px-3 py-2 font-mono text-[12px] text-ink"
            placeholder={placeholder}
          />
          <div className="text-[11px] text-ink-subtle">
            {t('adminPasteOnePerLine')}
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-2">
            {multilineItems ? (
              <textarea
                id={inputId}
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className="w-full vc-field"
                placeholder={placeholder}
              />
            ) : (
              <input
                id={inputId}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className="w-full vc-field"
                placeholder={placeholder}
              />
            )}
            <button
              type="button"
              onClick={addDraft}
              className="inline-flex shrink-0 items-center gap-1 rounded-field border border-line px-2 py-1 text-[11px] font-medium text-ink-muted hover:bg-surface-muted"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" /> {t('adminAddItem')}
            </button>
          </div>
          <div className="text-[11px] text-ink-subtle">
            {t('adminTipPasteValues')}
          </div>

          <div className={multilineItems ? 'space-y-2' : `grid grid-cols-1 gap-2 ${desktopColumns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            {normalizedItems.map((item, idx) => (
              <div key={`${item}:${idx}`} className="grid grid-cols-[1fr_auto] items-start gap-2 rounded-field border border-line p-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-line bg-surface-muted px-1 text-[11px] font-semibold text-ink-muted">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    {multilineItems ? (
                      <textarea
                        rows={2}
                        value={item}
                        onChange={(e) => {
                          const next = [...normalizedItems]
                          next[idx] = e.target.value
                          setItems(next.map((x) => x.trim()).filter(Boolean))
                        }}
                        className="w-full vc-field"
                      />
                    ) : (
                      <input
                        value={item}
                        onChange={(e) => {
                          const next = [...normalizedItems]
                          next[idx] = e.target.value
                          setItems(next.map((x) => x.trim()).filter(Boolean))
                        }}
                        className="w-full vc-field"
                      />
                    )}
                  </div>
                </div>
                <div className="inline-flex gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (idx === 0) return
                      const next = [...normalizedItems]
                      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
                      setItems(next)
                    }}
                    className="rounded-field border border-line p-1 text-ink-muted hover:bg-surface-muted disabled:opacity-40"
                    disabled={idx === 0}
                    aria-label={t('adminMoveItemUp').replace('{index}', String(idx + 1))}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (idx >= normalizedItems.length - 1) return
                      const next = [...normalizedItems]
                      ;[next[idx + 1], next[idx]] = [next[idx], next[idx + 1]]
                      setItems(next)
                    }}
                    className="rounded-field border border-line p-1 text-ink-muted hover:bg-surface-muted disabled:opacity-40"
                    disabled={idx >= normalizedItems.length - 1}
                    aria-label={t('adminMoveItemDown').replace('{index}', String(idx + 1))}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItems(normalizedItems.filter((_, i) => i !== idx))}
                    className="rounded-field border border-red-300/70 p-1 text-critical-soft-ink hover:bg-critical-soft"
                    aria-label={t('adminRemoveItem').replace('{index}', String(idx + 1))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {error ? (
        <div id={errorId} className="text-[11px] text-critical-soft-ink">
          {error}
        </div>
      ) : null}
    </div>
  )
}

