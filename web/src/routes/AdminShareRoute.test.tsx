import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../lib/i18n'
import { AdminShareRoute } from './AdminRoute'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('qrcode.react', async () => {
  const { forwardRef, createElement } = await import('react')
  return {
    QRCodeCanvas: forwardRef<HTMLCanvasElement>(
      (_: unknown, ref) => createElement('canvas', { ref }),
    ),
  }
})

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
  Object.defineProperty(navigator, 'share', {
    value: vi.fn(async () => {}),
    configurable: true,
    writable: true,
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

  it('shows a QR Code button for each visible active link', async () => {
    renderRoute()
    await flushEffects()

    const qrButtons = Array.from(document.querySelectorAll('button')).filter(
      (btn) => btn.textContent?.includes('QR Code'),
    )
    expect(qrButtons.length).toBeGreaterThan(0)
  })

  it('opens QR modal when QR Code button is clicked', async () => {
    renderRoute()
    await flushEffects()

    const qrButton = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('QR Code'),
    ) as HTMLButtonElement
    expect(qrButton).toBeTruthy()

    await act(async () => {
      qrButton.click()
      await Promise.resolve()
    })

    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
  })

  it('closes QR modal on Escape key', async () => {
    renderRoute()
    await flushEffects()

    const qrButton = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('QR Code'),
    ) as HTMLButtonElement

    await act(async () => {
      qrButton.click()
      await Promise.resolve()
    })

    expect(document.querySelector('[role="dialog"]')).toBeTruthy()

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await Promise.resolve()
    })

    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('shows a Share button for each visible active link', async () => {
    renderRoute()
    await flushEffects()

    const shareButtons = Array.from(document.querySelectorAll('button')).filter(
      (btn) => btn.textContent?.trim() === 'Share',
    )
    expect(shareButtons.length).toBeGreaterThan(0)
  })

  it('calls navigator.share with the link URL when Share is clicked', async () => {
    renderRoute()
    await flushEffects()

    const shareButton = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.trim() === 'Share',
    ) as HTMLButtonElement
    expect(shareButton).toBeTruthy()

    await act(async () => {
      shareButton.click()
      await Promise.resolve()
    })

    const shareMock = navigator.share as ReturnType<typeof vi.fn>
    expect(shareMock).toHaveBeenCalledTimes(1)
    const payload = shareMock.mock.calls[0][0] as { url?: string }
    expect(payload.url).toContain('abc123')
  })
})
