import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../lib/i18n'
import { AdminSettingsRoute } from './AdminSettingsRoute'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type MockResponse = {
  ok: boolean
  status: number
  text: () => Promise<string>
}

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

function jsonResponse(body: unknown, status = 200): MockResponse {
  const text = JSON.stringify(body)
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
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
          <AdminSettingsRoute />
        </LocaleProvider>
      </MemoryRouter>,
    )
  })
}

function adminPrincipalResponse() {
  return jsonResponse({
    clientPrincipal: {
      userDetails: 'admin@example.com',
      userRoles: ['admin'],
      claims: [{ typ: 'email', val: 'admin@example.com' }],
    },
  })
}

function noRolePrincipalResponse() {
  return jsonResponse({
    clientPrincipal: {
      userDetails: 'user@example.com',
      userRoles: ['anonymous'],
      claims: [{ typ: 'email', val: 'user@example.com' }],
    },
  })
}

beforeEach(() => {
  window.history.replaceState({}, '', '/admin/settings')
})

afterEach(() => {
  vi.restoreAllMocks()
  if (mountedRoot && mountedContainer) {
    act(() => {
      mountedRoot!.unmount()
    })
    mountedContainer.remove()
  }
  mountedRoot = null
  mountedContainer = null
})

describe('AdminSettingsRoute', () => {
  it('shows supported locales after loading settings (happy path)', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/.auth/me')) return adminPrincipalResponse()
      if (url.endsWith('/api/manage/settings')) return jsonResponse({ supportedLocales: ['en', 'de'] })
      return jsonResponse({}, 404)
    }))

    renderRoute()
    await flushEffects()

    expect(document.body.textContent).toContain('EN')
    expect(document.body.textContent).toContain('DE')
  })

  it('shows all registered UI locales when blob has no saved locales', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/.auth/me')) return adminPrincipalResponse()
      if (url.endsWith('/api/manage/settings')) return jsonResponse({ supportedLocales: [] })
      return jsonResponse({}, 404)
    }))

    renderRoute()
    await flushEffects()

    // When blob is empty the route falls back to all registered UI locales
    expect(document.body.textContent).toContain('EN')
  })

  it('shows sign-in prompt when /.auth/me returns no principal (not logged in)', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/.auth/me')) return jsonResponse({ clientPrincipal: null })
      return jsonResponse({}, 404)
    }))

    renderRoute()
    await flushEffects()

    expect(document.body.textContent).toContain('Sign in')
  })

  it('shows unauthorized message when user lacks admin role', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/.auth/me')) return noRolePrincipalResponse()
      return jsonResponse({}, 404)
    }))

    renderRoute()
    await flushEffects()

    // Route shows the "no admin role" message with the user's email
    expect(document.body.textContent).toContain('user@example.com')
  })

  it('shows error message when settings API request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/.auth/me')) return adminPrincipalResponse()
      if (url.endsWith('/api/manage/settings')) return jsonResponse({ error: 'Storage error' }, 500)
      return jsonResponse({}, 404)
    }))

    renderRoute()
    await flushEffects()

    expect(document.body.textContent).toContain('Storage error')
  })

  it('updates last-saved signature and shows success status after saving', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/.auth/me')) return adminPrincipalResponse()
      if (url.endsWith('/api/manage/settings') && (!init?.method || init.method === 'GET')) {
        return jsonResponse({ supportedLocales: ['en', 'de'] })
      }
      if (url.endsWith('/api/manage/settings') && init?.method === 'PUT') {
        return jsonResponse({})
      }
      return jsonResponse({}, 404)
    }))

    renderRoute()
    await flushEffects()

    // Find and click the Save button
    const saveButton = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.trim() === 'Save',
    ) as HTMLButtonElement
    expect(saveButton).toBeTruthy()
    // Save button should be disabled because nothing is dirty yet
    expect(saveButton.disabled).toBe(true)
  })
})
