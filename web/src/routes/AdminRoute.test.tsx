import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminDashboardRoute } from './AdminDashboardRoute'
import { LocaleProvider } from '../lib/i18n'

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
          <AdminDashboardRoute />
        </LocaleProvider>
      </MemoryRouter>,
    )
  })
}

beforeEach(() => {
  window.history.replaceState({}, '', '/admin')
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.endsWith('/.auth/me')) {
      return jsonResponse({
        clientPrincipal: {
          userDetails: 'admin@example.com',
          userRoles: ['admin'],
          claims: [{ typ: 'email', val: 'admin@example.com' }],
        },
      })
    }
    return jsonResponse({}, 404)
  }))
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

describe('AdminDashboardRoute', () => {
  it('shows language selector when not logged in', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/.auth/me')) {
        return jsonResponse({ clientPrincipal: null })
      }
      return jsonResponse({}, 404)
    }))

    renderRoute()
    await flushEffects()

    const selector = document.querySelector('button[aria-label="Language"]')
    expect(selector).toBeTruthy()
  })

  it('shows editor and share tiles', async () => {
    renderRoute()
    await flushEffects()

    const links = Array.from(document.querySelectorAll('a')).map((node) => node.getAttribute('href'))
    expect(links).toContain('/admin/editor')
    expect(links).toContain('/admin/share')
  })

  it('does not render share-link table on dashboard', async () => {
    renderRoute()
    await flushEffects()

    expect(document.body.textContent).not.toContain('Create share link')
    expect(document.body.textContent).toContain('Edit CV')
    expect(document.body.textContent).toContain('Share CV')
  })
})
