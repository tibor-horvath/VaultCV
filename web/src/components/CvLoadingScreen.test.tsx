import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { CvLoadingScreen } from './CvLoadingScreen'

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

describe('CvLoadingScreen', () => {
  it('announces the wait and hides the decorative skeleton from screen readers', () => {
    const container = render(<CvLoadingScreen label="Verifying access and loading CV..." />)

    const status = container.querySelector('[role="status"]')
    expect(status?.getAttribute('aria-busy')).toBe('true')
    expect(status?.textContent).toContain('Verifying access and loading CV...')

    const skeleton = container.querySelector('[aria-hidden="true"]')
    expect(skeleton).not.toBeNull()
    // One sweep per card, plus a ring beside the label so the wait clearly reads as active.
    expect(container.querySelectorAll('[class~="motion-safe:animate-shimmer"]').length).toBe(3)
    expect(container.querySelector('svg[class~="motion-safe:animate-spin"]')).not.toBeNull()
  })

  it('keeps the label screen-reader-only when embedded in an already-drawn page', () => {
    const container = render(<CvLoadingScreen label="Loading public profile preview" fullPage={false} />)

    expect(container.querySelector('.sr-only')?.textContent).toBe('Loading public profile preview')
    // No heading here — no ring and no wordmark; the surrounding page already carries both.
    expect(container.textContent).toBe('Loading public profile preview')
    expect(container.querySelector('svg[class~="motion-safe:animate-spin"]')).toBeNull()
    expect(container.querySelectorAll('[class~="motion-safe:animate-shimmer"]').length).toBe(3)
  })
})
