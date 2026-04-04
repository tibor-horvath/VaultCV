import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { enMessages } from '../../i18n/messages/en'
import type { MessageKey } from '../../i18n/messages'
import type { CvCredential } from '../../types/cv'
import { GroupedCredentials } from './GroupedCredentials'

const t = (key: MessageKey) => enMessages[key]

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  if (root && container) {
    const toUnmount = root
    const el = container
    act(() => {
      toUnmount.unmount()
    })
    el.remove()
  }
  root = null
  container = null
})

function renderGrouped(
  credentials: CvCredential[],
  options?: { showDates?: boolean },
) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(
      <GroupedCredentials
        credentials={credentials}
        t={t}
        showDates={options?.showDates}
      />,
    )
  })
}

describe('GroupedCredentials', () => {
  it('uses a two-column grid at large breakpoints', () => {
    renderGrouped([
      { issuer: 'microsoft', label: 'Cert A', url: 'https://a.example' },
      { issuer: 'language', label: 'Exam B', url: 'https://b.example' },
    ])
    const grid = container!.querySelector('[class*="lg:grid-cols-2"]')
    expect(grid).not.toBeNull()
  })

  it('groups items by issuer and shows issuer labels', () => {
    renderGrouped([
      { issuer: 'microsoft', label: 'Azure AI Fundamentals', url: 'https://ms.example' },
      { issuer: 'language', label: 'English B2', url: 'https://lang.example' },
    ])
    expect(container!.textContent).toContain(enMessages.languageExams)
    expect(container!.textContent).toContain('Azure AI Fundamentals')
    expect(container!.textContent).toContain('English B2')
  })

  it('renders a link when URL is present and plain text when absent', () => {
    renderGrouped([
      { issuer: 'other', label: 'With link', url: 'https://x.example' },
      { issuer: 'other', label: 'No link', url: '' },
    ])
    const anchors = container!.querySelectorAll('a[href^="https"]')
    expect(anchors.length).toBe(1)
    expect(anchors[0]?.getAttribute('href')).toBe('https://x.example')
    expect(container!.textContent).toContain('No link')
  })

  it('shows earned dates when showDates is true', () => {
    renderGrouped(
      [{ issuer: 'aws', label: 'SAA', url: 'https://aws.example', dateEarned: '2024-03' }],
      { showDates: true },
    )
    expect(container!.textContent).toContain(enMessages.earned)
    expect(container!.textContent).toContain('2024-03')
  })

  it('hides earned and expiry dates when showDates is false', () => {
    renderGrouped(
      [
        {
          issuer: 'aws',
          label: 'SAA',
          url: 'https://aws.example',
          dateEarned: '2024-03',
          dateExpires: '2026-01',
        },
      ],
      { showDates: false },
    )
    expect(container!.textContent).not.toContain(enMessages.earned)
    expect(container!.textContent).not.toContain(enMessages.expires)
    expect(container!.textContent).not.toContain('2024-03')
  })
})
