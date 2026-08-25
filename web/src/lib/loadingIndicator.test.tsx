import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLoadingIndicator } from './loadingIndicator'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

function Probe({ isLoading }: { isLoading: boolean }) {
  return <span>{useLoadingIndicator(isLoading) ? 'loader' : 'idle'}</span>
}

function render(isLoading: boolean) {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => {
    mountedRoot!.render(<Probe isLoading={isLoading} />)
  })
}

function rerender(isLoading: boolean) {
  act(() => {
    mountedRoot!.render(<Probe isLoading={isLoading} />)
  })
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

const shown = () => mountedContainer?.textContent === 'loader'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  if (mountedRoot) {
    act(() => {
      mountedRoot?.unmount()
    })
    mountedRoot = null
  }
  mountedContainer?.remove()
  mountedContainer = null
  vi.useRealTimers()
})

describe('useLoadingIndicator', () => {
  it('never shows a loader for a load that finishes inside the delay', () => {
    render(true)
    expect(shown()).toBe(false)

    advance(150)
    rerender(false)
    advance(1000)

    expect(shown()).toBe(false)
  })

  it('shows a loader once the wait outlasts the delay', () => {
    render(true)

    advance(150)
    expect(shown()).toBe(false)

    advance(100)
    expect(shown()).toBe(true)
  })

  it('holds a shown loader for the minimum duration so it cannot strobe', () => {
    render(true)
    advance(250)
    expect(shown()).toBe(true)

    // Data lands one frame after the loader appeared.
    rerender(false)
    advance(100)
    expect(shown()).toBe(true)

    advance(400)
    expect(shown()).toBe(false)
  })

  it('drops the loader immediately when it has already been visible long enough', () => {
    render(true)
    advance(250)
    advance(500)
    expect(shown()).toBe(true)

    rerender(false)
    advance(1)

    expect(shown()).toBe(false)
  })
})
