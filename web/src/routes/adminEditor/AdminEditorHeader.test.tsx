import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminEditorHeader } from './AdminEditorHeader'
import { LocaleProvider } from '../../lib/i18n'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

function renderHeader(
  hasUnsavedChanges: boolean,
  setLocale = vi.fn(),
  onOpenReorderSheet?: () => void,
  opts: { isLocaleEnabled?: boolean; onToggleLocaleEnabled?: () => void } = {},
) {
  const isLocaleEnabled = opts.isLocaleEnabled ?? true
  const onToggleLocaleEnabled = opts.onToggleLocaleEnabled ?? vi.fn()
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => {
    mountedRoot!.render(
      <MemoryRouter>
        <LocaleProvider>
          <AdminEditorHeader
            locale="en"
            locales={[
              { locale: 'en', label: 'English' },
              { locale: 'de', label: 'Deutsch' },
            ]}
            addableLocales={[{ locale: 'hu', label: 'Magyar' }]}
            setLocale={setLocale}
            onAddLocale={() => {}}
            isLocaleEnabled={isLocaleEnabled}
            onToggleLocaleEnabled={onToggleLocaleEnabled}
            hasUnsavedChanges={hasUnsavedChanges}
            loading={false}
            saving={false}
            onSave={() => {}}
            onOpenReorderSheet={onOpenReorderSheet}
          />
        </LocaleProvider>
      </MemoryRouter>,
    )
  })
  return { setLocale, onToggleLocaleEnabled }
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

describe('AdminEditorHeader', () => {
  it('binds locale label to select input', () => {
    renderHeader(false)
    const label = document.querySelector('label[for="admin-editor-locale-select"]') as HTMLLabelElement
    const select = document.getElementById('admin-editor-locale-select') as HTMLSelectElement
    expect(label).toBeTruthy()
    expect(select).toBeTruthy()
  })

  it('blocks back navigation when unsaved changes are not confirmed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderHeader(true)
    const backLink = Array.from(document.querySelectorAll('a')).find((node) => node.textContent?.includes('Dashboard')) as HTMLAnchorElement
    const prevented = !backLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(prevented).toBe(true)
    confirmSpy.mockRestore()
  })

  it('opens reorder sheet from the header action', () => {
    const onOpenReorderSheet = vi.fn()
    renderHeader(false, vi.fn(), onOpenReorderSheet)
    const reorderButton = Array.from(document.querySelectorAll('button')).find((node) =>
      node.textContent?.includes('Reorder sections'),
    ) as HTMLButtonElement
    expect(reorderButton).toBeTruthy()
    act(() => {
      reorderButton.click()
    })
    expect(onOpenReorderSheet).toHaveBeenCalledTimes(1)
  })

  it('renders toggle button showing Enabled when isLocaleEnabled is true', () => {
    renderHeader(false, vi.fn(), undefined, { isLocaleEnabled: true })
    const toggleButton = Array.from(document.querySelectorAll('button')).find((node) =>
      node.textContent?.includes('Enabled'),
    ) as HTMLButtonElement
    expect(toggleButton).toBeTruthy()
    expect(toggleButton.getAttribute('aria-pressed')).toBe('true')
  })

  it('renders toggle button showing Disabled when isLocaleEnabled is false', () => {
    renderHeader(false, vi.fn(), undefined, { isLocaleEnabled: false })
    const toggleButton = Array.from(document.querySelectorAll('button')).find((node) =>
      node.textContent?.includes('Disabled'),
    ) as HTMLButtonElement
    expect(toggleButton).toBeTruthy()
    expect(toggleButton.getAttribute('aria-pressed')).toBe('false')
  })

  it('calls onToggleLocaleEnabled with new value when toggle is clicked', () => {
    const onToggleLocaleEnabled = vi.fn()
    renderHeader(false, vi.fn(), undefined, { isLocaleEnabled: true, onToggleLocaleEnabled })
    const toggleButton = Array.from(document.querySelectorAll('button')).find((node) =>
      node.textContent?.includes('Enabled'),
    ) as HTMLButtonElement
    act(() => {
      toggleButton.click()
    })
    expect(onToggleLocaleEnabled).toHaveBeenCalledTimes(1)
    expect(onToggleLocaleEnabled).toHaveBeenCalledWith(false)
  })
})
