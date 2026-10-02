import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../lib/i18n'
import type { PdfVariant } from '../../lib/pdfVariant'
import { PdfDownloadMenu } from './PdfDownloadMenu'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

function renderMenu(
  selected: PdfVariant,
  { onDownload = vi.fn(), onSelect = vi.fn(), busy = false }: {
    onDownload?: (v: PdfVariant) => void
    onSelect?: (v: PdfVariant) => void
    busy?: boolean
  } = {},
) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(
      <LocaleProvider>
        <PdfDownloadMenu busy={busy} selected={selected} onSelect={onSelect} onDownload={onDownload} />
      </LocaleProvider>,
    )
  })
}

function click(el: Element | null | undefined) {
  expect(el).toBeTruthy()
  act(() => {
    ;(el as HTMLElement).click()
  })
}

const trigger = () => container!.querySelector('[aria-haspopup="menu"]')
const items = () => [...container!.querySelectorAll('[role="menuitem"]')]

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

describe('PdfDownloadMenu', () => {
  it('opens a chooser from the single download button instead of downloading', () => {
    const onDownload = vi.fn()
    renderMenu('print', { onDownload })
    expect(trigger()!.getAttribute('aria-label')).toBe('Download PDF')
    click(trigger())
    expect(trigger()!.getAttribute('aria-expanded')).toBe('true')
    expect(container!.querySelector('[role="menu"]')).toBeTruthy()
    expect(onDownload).not.toHaveBeenCalled()
  })

  it('shows both formats and tags the last used one', () => {
    renderMenu('modern')
    click(trigger())
    const [modern, print] = items()
    expect(modern!.textContent).toContain('Modern')
    expect(modern!.textContent).toContain('Last used')
    expect(print!.textContent).toContain('Print-friendly')
    expect(print!.textContent).not.toContain('Last used')
  })

  it('downloads a format as soon as it is picked, and remembers it', () => {
    const onDownload = vi.fn()
    const onSelect = vi.fn()
    renderMenu('modern', { onDownload, onSelect })
    click(trigger())
    click(items()[1])
    expect(onSelect).toHaveBeenCalledWith('print')
    expect(onDownload).toHaveBeenCalledWith('print')
    expect(container!.querySelector('[role="menu"]')).toBeNull()
  })

  it('closes on Escape', () => {
    renderMenu('modern')
    click(trigger())
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(container!.querySelector('[role="menu"]')).toBeNull()
  })

  it('cannot open while a PDF is generating', () => {
    renderMenu('modern', { busy: true })
    expect((trigger() as HTMLButtonElement).disabled).toBe(true)
    expect(trigger()!.getAttribute('aria-label')).toBe('Generating…')
  })
})
