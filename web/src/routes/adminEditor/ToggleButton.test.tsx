import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../lib/i18n'
import { ToggleButton } from './ToggleButton'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

function renderToggle(pressed: boolean, onClick = vi.fn()) {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => {
    mountedRoot!.render(
      <LocaleProvider>
        <ToggleButton pressed={pressed} onClick={onClick} label="Skill" />
      </LocaleProvider>,
    )
  })
  return onClick
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

describe('ToggleButton', () => {
  it('exposes pressed state with aria-pressed', () => {
    renderToggle(true)
    const button = document.querySelector('button') as HTMLButtonElement
    expect(button.getAttribute('aria-pressed')).toBe('true')
  })

  it('fires onClick when activated', () => {
    const onClick = renderToggle(false)
    const button = document.querySelector('button') as HTMLButtonElement
    act(() => {
      button.click()
    })
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
