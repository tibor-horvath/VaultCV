import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IconSelect, type IconSelectOption } from './IconSelect'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

function renderIconSelect(params: {
  value?: string
  onChange?: (value: string) => void
  options?: IconSelectOption[]
}) {
  const options: IconSelectOption[] = params.options ?? [
    { value: '', label: 'Select...' },
    { value: 'github', label: 'GitHub' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'custom', label: 'Custom' },
  ]

  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => {
    mountedRoot!.render(
      <IconSelect
        value={params.value ?? ''}
        onChange={params.onChange ?? (() => {})}
        options={options}
        placeholder="Select..."
        ariaLabel="Icon select test"
      />,
    )
  })
}

function dispatchKey(target: Element, key: string) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
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

describe('IconSelect keyboard interactions', () => {
  it('opens with Enter and closes with Escape, returning focus', () => {
    renderIconSelect({ value: '' })
    const trigger = document.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement
    expect(trigger).toBeTruthy()

    trigger.focus()
    act(() => {
      dispatchKey(trigger, 'Enter')
    })
    expect(document.querySelector('[role="listbox"]')).toBeTruthy()

    const focusedOption = document.activeElement as HTMLButtonElement
    act(() => {
      dispatchKey(focusedOption, 'Escape')
    })
    expect(document.querySelector('[role="listbox"]')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('selects with ArrowDown then Enter', () => {
    const onChange = vi.fn<(value: string) => void>()
    renderIconSelect({ value: '', onChange })
    const trigger = document.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement
    trigger.focus()

    act(() => {
      dispatchKey(trigger, 'ArrowDown')
    })
    act(() => {
      dispatchKey(document.activeElement as Element, 'ArrowDown')
    })

    const focusedOption = document.activeElement as HTMLButtonElement
    expect(focusedOption.textContent).toContain('GitHub')

    act(() => {
      dispatchKey(focusedOption, 'Enter')
    })

    expect(onChange).toHaveBeenCalledWith('github')
    expect(document.querySelector('[role="listbox"]')).toBeNull()
  })

  it('supports Home and End navigation', () => {
    renderIconSelect({ value: '' })
    const trigger = document.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement
    trigger.focus()

    act(() => {
      dispatchKey(trigger, 'ArrowDown')
    })

    act(() => {
      dispatchKey(document.activeElement as Element, 'End')
    })
    expect((document.activeElement as HTMLButtonElement).textContent).toContain('Custom')

    act(() => {
      dispatchKey(document.activeElement as Element, 'Home')
    })
    expect((document.activeElement as HTMLButtonElement).textContent).toContain('Select...')
  })

  it('closes when clicking outside', () => {
    renderIconSelect({ value: '' })
    const trigger = document.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement
    trigger.focus()

    act(() => {
      trigger.click()
    })
    expect(document.querySelector('[role="listbox"]')).toBeTruthy()

    act(() => {
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    })
    expect(document.querySelector('[role="listbox"]')).toBeNull()
  })
})

