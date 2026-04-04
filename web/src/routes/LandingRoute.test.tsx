import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enMessages } from '../i18n/messages/en'
import { fetchCv } from '../lib/api'
import { fetchPublicCvProfile } from '../lib/publicProfile'
import { fetchProfileScopedLocales } from '../lib/profileLocaleAvailability'
import { LocaleProvider } from '../lib/i18n'
import { ThemeProvider } from '../lib/themeContext'
import { LandingRoute } from './LandingRoute'

vi.mock('../lib/favicon', () => ({
  useDocumentFavicon: vi.fn(),
}))

vi.mock('../lib/appView', () => ({
  useAppView: () => ({ view: 'landing' as const, openCv: vi.fn(), goHome: vi.fn() }),
}))

vi.mock('../lib/publicProfile', () => ({
  fetchPublicCvProfile: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  fetchCv: vi.fn(),
}))

vi.mock('../lib/profileLocaleAvailability', () => ({
  fetchProfileScopedLocales: vi.fn(),
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function flushUntil(
  predicate: () => boolean,
  maxTicks = 30,
): Promise<void> {
  for (let i = 0; i < maxTicks; i++) {
    if (predicate()) return
    await act(async () => {
      await new Promise<void>((r) => queueMicrotask(r))
    })
  }
}

function renderLanding(initialPath = '/') {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => {
    mountedRoot!.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <LocaleProvider>
          <ThemeProvider>
            <LandingRoute />
          </ThemeProvider>
        </LocaleProvider>
      </MemoryRouter>,
    )
  })
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ locales: ['en', 'de', 'hu'] }),
    })),
  )
  vi.mocked(fetchCv).mockResolvedValue({ ok: false, status: 401, code: 'unauthorized' })
  vi.mocked(fetchProfileScopedLocales).mockResolvedValue(['en'])
})

afterEach(() => {
  vi.restoreAllMocks()
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

describe('LandingRoute', () => {
  it('shows a skeleton with pulse placeholders while the public profile is still loading', async () => {
    vi.mocked(fetchPublicCvProfile).mockImplementation(
      () => new Promise(() => {}),
    )

    renderLanding('/')

    await flushUntil(
      () =>
        Boolean(document.body.textContent?.includes(enMessages.loadingPublicPreview)) &&
        document.querySelector('.animate-pulse') !== null,
    )

    expect(document.querySelector('.animate-pulse')).not.toBeNull()
    expect(document.body.textContent).toContain(enMessages.loadingPublicPreview)
    const statusRegions = document.querySelectorAll('[role="status"]')
    expect(statusRegions.length).toBeGreaterThan(0)
  })

  it('shows access code hint when locked and hides it after a code is entered', async () => {
    vi.mocked(fetchPublicCvProfile).mockResolvedValue({
      basics: { name: 'Test User', headline: 'Engineer' },
      sectionOrder: [],
    })

    renderLanding('/')

    await flushUntil(() => document.body.textContent?.includes('Test User') ?? false)

    expect(document.getElementById('token-hint')).not.toBeNull()
    expect(document.body.textContent).toContain(enMessages.accessCodeHint)

    const input = document.getElementById('token') as HTMLInputElement
    expect(input).not.toBeNull()

    await act(async () => {
      const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
      proto?.set?.call(input, 'secret-token')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await flushMicrotasks()

    expect(document.getElementById('token-hint')).toBeNull()
  })

  it('places the access card before the preview on narrow breakpoints when locked', async () => {
    vi.mocked(fetchPublicCvProfile).mockResolvedValue({
      basics: { name: 'Test User', headline: 'Engineer' },
      sectionOrder: [],
    })

    renderLanding('/')

    await flushUntil(() => document.body.textContent?.includes('Test User') ?? false)

    const token = document.getElementById('token')
    expect(token).not.toBeNull()
    let el: HTMLElement | null = token
    let found: HTMLElement | null = null
    while (el) {
      if (typeof el.className === 'string' && el.className.includes('order-1') && el.className.includes('sm:order-2')) {
        found = el
        break
      }
      el = el.parentElement
    }
    expect(found).not.toBeNull()
  })

  it('renders public credentials in a grouped two-column layout and omits earned dates', async () => {
    vi.mocked(fetchPublicCvProfile).mockResolvedValue({
      basics: { name: 'Test User', headline: 'Engineer' },
      sectionOrder: [],
      credentials: [
        {
          issuer: 'microsoft',
          label: 'Microsoft Certified: Azure AI Fundamentals',
          url: 'https://learn.microsoft.com/credentials/example',
          dateEarned: '2026-03',
        },
        {
          issuer: 'language',
          label: 'English — TELC B2 (oral)',
          url: 'https://example.com/telc',
        },
      ],
    })

    renderLanding('/')

    await flushUntil(() => document.body.textContent?.includes('Test User') ?? false)

    expect(document.body.textContent).toContain(enMessages.credentials)
    expect(document.body.textContent).toContain(enMessages.languageExams)
    expect(document.body.textContent).toContain('Microsoft Certified: Azure AI Fundamentals')
    expect(document.body.textContent).toContain('English — TELC B2 (oral)')

    const grid = document.querySelector('[class*="lg:grid-cols-2"]')
    expect(grid).not.toBeNull()

    // Landing strips dates for privacy; GroupedCredentials uses showDates={false}.
    expect(document.body.textContent).not.toContain(`${enMessages.earned} 2026`)
    expect(document.body.textContent).not.toContain(`${enMessages.earned} 2026-03`)
  })
})
