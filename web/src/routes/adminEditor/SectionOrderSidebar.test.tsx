import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../lib/i18n'
import type { SectionKey } from '../../lib/sectionOrder'
import { SectionOrderSidebar } from './SectionOrderSidebar'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

const ORDER: SectionKey[] = [
  'credentials',
  'skillsLanguages',
  'experience',
  'projects',
  'education',
  'hobbiesInterests',
  'honorsAwards',
]

function renderSidebar(setSectionOrder = vi.fn()) {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => {
    mountedRoot!.render(
      <LocaleProvider>
        <SectionOrderSidebar sectionOrder={ORDER} setSectionOrder={setSectionOrder} />
      </LocaleProvider>,
    )
  })
  return setSectionOrder
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

describe('SectionOrderSidebar', () => {
  it('renders basics as pinned and shows section labels', () => {
    renderSidebar()
    expect(document.body.textContent).toContain('Basics')
    expect(document.body.textContent).toContain('Credentials')
    expect(document.body.textContent).toContain('Projects')
  })

  it('scrolls to a section when a section label is clicked', () => {
    renderSidebar()
    const target = document.createElement('section')
    target.setAttribute('data-section', 'credentials')
    target.scrollIntoView = vi.fn()
    document.body.appendChild(target)

    const credentialsButton = Array.from(document.querySelectorAll('button')).find((node) =>
      node.textContent?.includes('Credentials'),
    ) as HTMLButtonElement
    expect(credentialsButton).toBeTruthy()

    act(() => {
      credentialsButton.click()
    })

    expect(target.scrollIntoView).toHaveBeenCalledTimes(1)
    target.remove()
  })
})
