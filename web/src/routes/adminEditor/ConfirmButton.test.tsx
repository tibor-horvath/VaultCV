import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfirmButton } from './ConfirmButton'
import { LocaleProvider } from '../../lib/i18n'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

function renderConfirmButton(onConfirm = vi.fn()) {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => {
    mountedRoot!.render(
      <LocaleProvider>
        <ConfirmButton
          label="Remove"
          className="test-button"
          confirmTitle="Confirm remove"
          confirmDescription="This action cannot be undone."
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onConfirm={onConfirm}
        />
      </LocaleProvider>,
    )
  })
  return onConfirm
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

describe('ConfirmButton', () => {
  it('closes on Escape and restores focus', () => {
    renderConfirmButton()
    const trigger = document.querySelector('button.test-button') as HTMLButtonElement
    trigger.focus()
    act(() => {
      trigger.click()
    })
    const dialog = document.querySelector('[role="dialog"]') as HTMLDivElement
    expect(dialog).toBeTruthy()

    act(() => {
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('calls onConfirm and closes', () => {
    const onConfirm = renderConfirmButton()
    const trigger = document.querySelector('button.test-button') as HTMLButtonElement
    act(() => {
      trigger.click()
    })

    const dialog = document.querySelector('[role="dialog"]') as HTMLDivElement
    const confirm = Array.from(dialog.querySelectorAll('button')).find((node) => node.textContent?.includes('Remove')) as HTMLButtonElement
    act(() => {
      confirm.click()
    })
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })
})
