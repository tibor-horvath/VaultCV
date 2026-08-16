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

    const spinner = status?.querySelector('.animate-spin')
    expect(spinner).not.toBeNull()
    expect(spinner?.getAttribute('aria-hidden')).toBe('true')
  })

  it('keeps the label available to screen readers when hidden', () => {
    const container = render(<LoadingSpinner label="Checking access..." labelHidden />)

    const label = container.querySelector('p')
    expect(label?.textContent).toBe('Checking access...')
    expect(label?.className).toContain('sr-only')
  })
})
