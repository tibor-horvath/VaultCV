import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminEditorHeader } from './AdminEditorHeader'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

function renderHeader(hasUnsavedChanges: boolean, setLocale = vi.fn()) {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => {
    mountedRoot!.render(
      <MemoryRouter>
        <AdminEditorHeader
          locale="en"
          locales={[
            { locale: 'en', label: 'English' },
            { locale: 'fr', label: 'French' },
          ]}
          setLocale={setLocale}
          hasUnsavedChanges={hasUnsavedChanges}
          loading={false}
          onSave={() => {}}
        />
      </MemoryRouter>,
    )
  })
  return setLocale
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
    const backLink = Array.from(document.querySelectorAll('a')).find((node) => node.textContent?.includes('Back to admin')) as HTMLAnchorElement
    const prevented = !backLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(prevented).toBe(true)
    confirmSpy.mockRestore()
  })
})
