import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { LoadingSpinner } from './LoadingSpinner'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

function render(element: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(element)
  })
  mountedRoot = root
  mountedContainer = container
  return container
}

afterEach(() => {
  if (mountedRoot) {
    act(() => {
      mountedRoot?.unmount()
    })
    mountedRoot = null
  }
  mountedContainer?.remove()
  mountedContainer = null
})

describe('LoadingSpinner', () => {
  it('renders an animated spinner in a busy live region', () => {
    const container = render(<LoadingSpinner label="Verifying access and loading CV..." />)

    const status = container.querySelector('[role="status"]')
    expect(status).not.toBeNull()
    expect(status?.getAttribute('aria-busy')).toBe('true')
    expect(status?.textContent).toBe('Verifying access and loading CV...')

    const ring = status?.querySelector('svg[class~="motion-safe:animate-spin"]')
    expect(ring).not.toBeNull()
    expect(ring?.getAttribute('aria-hidden')).toBe('true')
    // A track circle plus one round-capped arc — no hard border seam.
    const arc = ring?.querySelectorAll('circle')[1]
    expect(arc?.getAttribute('stroke-linecap')).toBe('round')
  })

  it('centres a document glyph in the ring so the wait reads as a CV load', () => {
    const container = render(<LoadingSpinner label="Verifying access and loading CV..." />)

    const icon = container.querySelector('svg.lucide-file-text')
    expect(icon).not.toBeNull()
    expect(icon?.getAttribute('aria-hidden')).toBe('true')
    // The glyph is decoration, so it must not leak into the announced text.
    expect(container.querySelector('[role="status"]')?.textContent).toBe('Verifying access and loading CV...')
  })

  it('keeps the label available to screen readers when hidden', () => {
    const container = render(<LoadingSpinner label="Checking access..." labelHidden />)

    const label = container.querySelector('p')
    expect(label?.textContent).toBe('Checking access...')
    expect(label?.className).toContain('sr-only')
  })
})
