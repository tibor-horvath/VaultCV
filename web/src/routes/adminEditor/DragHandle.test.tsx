import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { DragHandle, DragHandleContext } from './DragHandle'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

function renderHandle(onPointerDown = vi.fn()) {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)

  const contextValue = {
    attributes: { role: 'button' } as DraggableAttributes,
    listeners: { onPointerDown } as SyntheticListenerMap,
  }

  act(() => {
    mountedRoot!.render(
      <DragHandleContext.Provider value={contextValue}>
        <DragHandle label="Drag row" className="custom-class" />
      </DragHandleContext.Provider>,
    )
  })

  return onPointerDown
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

describe('DragHandle', () => {
  it('renders an accessible drag button and merges custom classes', () => {
    renderHandle()
    const button = document.querySelector('button[aria-label="Drag row"]') as HTMLButtonElement
    expect(button).toBeTruthy()
    expect(button.className).toContain('custom-class')
    expect(button.className).toContain('cursor-grab')
  })

  it('forwards drag listeners from context', () => {
    const onPointerDown = renderHandle()
    const button = document.querySelector('button[aria-label="Drag row"]') as HTMLButtonElement
    act(() => {
      button.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    })
    expect(onPointerDown).toHaveBeenCalledTimes(1)
  })
})
