import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../lib/i18n'
import type { SectionKey } from '../../lib/sectionOrder'
import { SectionOrderSheet } from './SectionOrderSheet'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

const ORDER: SectionKey[] = [
  'credentials',
  'skillsLanguages',
  'experience',
  'projects',
  'education',
  'hobbiesInterests',
  'honorsAwards',
]

function renderSheet(isOpen: boolean, onClose = vi.fn(), setSectionOrder = vi.fn()) {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => {
    mountedRoot!.render(
      <LocaleProvider>
        <SectionOrderSheet isOpen={isOpen} onClose={onClose} sectionOrder={ORDER} setSectionOrder={setSectionOrder} />
      </LocaleProvider>,
    )
  })
  return { onClose, setSectionOrder }
}

afterEach(() => {
  if (mountedRoot && mountedContainer) {
    act(() => {
      mountedRoot!.unmount()
    })
    mountedContainer.remove()
  }
  mountedRoot = null
  mountedContainer = null
})

describe('SectionOrderSheet', () => {
  it('renders closed by default with hidden transform class', () => {
    renderSheet(false)
    const dialog = document.querySelector('[role="dialog"]') as HTMLDivElement
    expect(dialog).toBeTruthy()
    expect(dialog.className).toContain('translate-y-full')
  })

  it('renders open state and pinned basics row', () => {
    renderSheet(true)
    const dialog = document.querySelector('[role="dialog"]') as HTMLDivElement
    expect(dialog.className).toContain('translate-y-0')
    expect(document.body.textContent).toContain('Basics (pinned at top)')
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    renderSheet(true, onClose)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
