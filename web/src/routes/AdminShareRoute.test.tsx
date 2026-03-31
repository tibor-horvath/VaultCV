import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../lib/i18n'
import { AdminShareRoute } from './AdminRoute'

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
          <AdminShareRoute />
        </LocaleProvider>
      </MemoryRouter>,
    )
  })
}

beforeEach(() => {
  window.history.replaceState({}, '', '/admin/share')
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
    if (url.endsWith('/api/manage/links')) {
      const now = Math.floor(Date.now() / 1000)
      return jsonResponse({
        links: [
          {
            rowKey: 'abc123',
            createdAtEpoch: 1,
            expiresAtEpoch: now + 3600,
            viewCount: 0,
          },
          {
            rowKey: 'revoked1',
            createdAtEpoch: 1,
            expiresAtEpoch: now + 3600,
            revokedAtEpoch: now - 10,
            viewCount: 3,
          },
          {
            rowKey: 'expired1',
            createdAtEpoch: 1,
            expiresAtEpoch: now - 10,
            viewCount: 7,
          },
        ],
      })
    }
    if (url.includes('/api/manage/links/') && url.endsWith('/revoke')) {
      return jsonResponse({ ok: true })
    }
    return jsonResponse({}, 404)
  }))
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn(async () => {}) },
    configurable: true,
  })
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

describe('AdminShareRoute', () => {
  it('asks for confirmation before revoking', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderRoute()
    await flushEffects()

    const revokeButton = Array.from(document.querySelectorAll('button[title="Revoke"]')).find(
      (node) => !(node as HTMLButtonElement).disabled,
    ) as HTMLButtonElement
    expect(revokeButton).toBeTruthy()

    await act(async () => {
      revokeButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await Promise.resolve()
    })

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    const fetchCalls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((call) => String(call[0]))
    expect(fetchCalls.some((url) => url.includes('/revoke'))).toBe(false)
    confirmSpy.mockRestore()
  })

  it('shows copy feedback after copying a link', async () => {
    renderRoute()
    await flushEffects()

    const copyButton = Array.from(document.querySelectorAll('button')).find((node) => node.textContent?.trim() === 'Copy') as HTMLButtonElement
    expect(copyButton).toBeTruthy()

    await act(async () => {
      copyButton.click()
      await Promise.resolve()
    })

    expect(document.body.textContent).toContain('Share link copied.')
  })

  it('filters with single-select controls and syncs status in URL', async () => {
    renderRoute()
    await flushEffects()

    expect(document.body.textContent).toContain('Showing 1 of 3 links')
    expect(window.location.search).toContain('status=active')

    const allButton = Array.from(document.querySelectorAll('button')).find((node) => node.textContent?.trim() === 'All') as HTMLButtonElement
    await act(async () => {
      allButton.click()
      await Promise.resolve()
    })

    expect(document.body.textContent).toContain('Showing 3 of 3 links')
    expect(window.location.search).toContain('status=all')
  })
})
