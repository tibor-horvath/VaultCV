import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useScrolledPast } from './useScrolledPast'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null
let frames: Array<() => void> = []

/** Runs whatever the hook queued for the next frame. */
function flushFrames() {
  const queued = frames
  frames = []
  act(() => {
    for (const cb of queued) cb()
  })
}

function Probe({ bottom, offset }: { bottom: number; offset?: number }) {
  const [ref, scrolledPast] = useScrolledPast(offset)
  return (
    <div
      ref={(node) => {
        if (node) node.getBoundingClientRect = () => ({ bottom }) as DOMRect
        ref(node)
      }}
      data-testid="probe"
      data-past={String(scrolledPast)}
    />
  )
}

function render(element: React.ReactElement) {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => {
    mountedRoot!.render(element)
  })
  return mountedContainer
}

function readPast() {
  return document.querySelector('[data-testid="probe"]')?.getAttribute('data-past')
}

beforeEach(() => {
  frames = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.push(() => cb(0))
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  if (mountedRoot && mountedContainer) {
    act(() => {
      mountedRoot!.unmount()
    })
    mountedContainer.remove()
  }
  mountedRoot = null
  mountedContainer = null
})

describe('useScrolledPast', () => {
  it('reports false while the element is still on screen', () => {
    render(<Probe bottom={400} />)
    flushFrames()
    expect(readPast()).toBe('false')
  })

  it('reports true once the element has passed the offset', () => {
    render(<Probe bottom={20} offset={56} />)
    flushFrames()
    expect(readPast()).toBe('true')
  })

  it('re-measures on scroll, including scrolls inside a nested container', () => {
    // The capture-phase listener is the reason this works regardless of which element scrolls —
    // a scroll event on an inner div never reaches `window` in the bubble phase.
    const scroller = document.createElement('div')
    document.body.appendChild(scroller)

    render(<Probe bottom={400} offset={56} />)
    flushFrames()
    expect(readPast()).toBe('false')

    const probe = document.querySelector('[data-testid="probe"]') as HTMLElement
    probe.getBoundingClientRect = () => ({ bottom: -10 }) as DOMRect
    act(() => {
      scroller.dispatchEvent(new Event('scroll', { bubbles: false }))
    })
    flushFrames()

    expect(readPast()).toBe('true')
    scroller.remove()
  })
})
