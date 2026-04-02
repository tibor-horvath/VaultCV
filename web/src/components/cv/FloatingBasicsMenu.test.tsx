import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { LocaleProvider } from '../../lib/i18n'
import { FloatingBasicsMenu } from './FloatingBasicsMenu'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

const basics = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  photoUrl: '/api/private/profile-image',
  headline: 'Engineer',
}

const links = [
  { label: 'GitHub', url: 'https://github.com/jane' },
  { label: 'LinkedIn', url: 'https://linkedin.com/in/jane' },
]

function renderMenu(visible: boolean) {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => {
    mountedRoot!.render(
      <LocaleProvider>
        <FloatingBasicsMenu basics={basics} links={links} visible={visible} />
      </LocaleProvider>,
    )
  })
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

describe('FloatingBasicsMenu', () => {
  it('is marked hidden and non-focusable when not visible', () => {
    renderMenu(false)

    const root = document.querySelector('[data-testid="floating-basics-menu"]') as HTMLDivElement
    expect(root.getAttribute('aria-hidden')).toBe('true')

    const anchors = Array.from(root.querySelectorAll('a'))
    expect(anchors.length).toBeGreaterThan(0)
    expect(anchors.every((anchor) => anchor.tabIndex === -1)).toBe(true)
  })

  it('is exposed and focusable when visible', () => {
    renderMenu(true)

    const root = document.querySelector('[data-testid="floating-basics-menu"]') as HTMLDivElement
    expect(root.getAttribute('aria-hidden')).toBe('false')

    const anchors = Array.from(root.querySelectorAll('a'))
    expect(anchors.length).toBeGreaterThan(0)
    expect(anchors.every((anchor) => anchor.tabIndex === 0)).toBe(true)
  })
})
