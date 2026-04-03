import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminEditorRoute } from './AdminEditorRoute'
import { LocaleProvider } from '../lib/i18n'
import { deMessages } from '../i18n/messages/de'
import { huMessages } from '../i18n/messages/hu'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type MockResponse = {
  ok: boolean
  status: number
  text: () => Promise<string>
  json: () => Promise<unknown>
}

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(max-width: 767px)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

function jsonResponse(body: unknown, status = 200): MockResponse {
  const text = JSON.stringify(body)
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    json: async () => body,
  }
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

function renderRoute() {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => {
    mountedRoot!.render(
      <MemoryRouter>
        <LocaleProvider>
          <AdminEditorRoute />
        </LocaleProvider>
      </MemoryRouter>,
    )
  })
}

beforeEach(() => {
  mockMatchMedia(false)
  window.history.replaceState({}, '', '/admin/editor')
  window.localStorage.clear()
  window.localStorage.setItem('cv-locale', 'de')
  vi.spyOn(window, 'confirm').mockReturnValue(true)

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/.auth/me')) {
        return jsonResponse({
          clientPrincipal: {
            userDetails: 'admin@example.com',
            userRoles: ['admin'],
          },
        })
      }
      if (url.includes('/api/locales')) {
        return jsonResponse({ locales: ['en', 'de', 'hu'] })
      }
      if (url.includes('/api/manage/profile/private')) {
        return jsonResponse({ json: '{}' })
      }
      if (url.includes('/api/manage/profile/public')) {
        return jsonResponse({ json: '{}' })
      }
      return jsonResponse({}, 404)
    }),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
  if (mountedRoot && mountedContainer) {
    act(() => {
      mountedRoot!.unmount()
    })
    mountedContainer.remove()
  }
  mountedRoot = null
  mountedContainer = null
})

describe('AdminEditorRoute', () => {
  it('initializes from the current UI locale and keeps UI language synced with editor locale changes', async () => {
    renderRoute()
    await flushEffects()

    expect(document.body.textContent).toContain(deMessages.adminEditCv)
    expect(document.documentElement.lang).toBe('de')

    const localeSelect = document.getElementById('admin-editor-locale-select') as HTMLSelectElement
    expect(localeSelect.value).toBe('de')

    await act(async () => {
      localeSelect.value = 'hu'
      localeSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await flushEffects()

    expect(document.body.textContent).toContain(huMessages.adminEditCv)
    expect(document.documentElement.lang).toBe('hu')
    expect(localeSelect.value).toBe('hu')

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/manage/profile/private?locale=hu'))).toBe(true)
  })
})
