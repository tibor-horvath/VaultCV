import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminBrandingRoute } from './AdminBrandingRoute'
import { LocaleProvider } from '../lib/i18n'
import { ThemeProvider } from '../lib/themeContext'
import { enMessages } from '../i18n/messages'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const SVG = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg"></svg>')}`

function jsonResponse(body: unknown, status = 200) {
  const text = JSON.stringify(body)
  return { ok: status >= 200 && status < 300, status, text: async () => text, json: async () => body }
}

let root: Root | null = null
let container: HTMLDivElement | null = null
let stored: unknown = {}
let fetchMock: ReturnType<typeof vi.fn>

async function flush() {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await Promise.resolve()
    })
  }
}

async function renderRoute() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(
      <MemoryRouter>
        <LocaleProvider>
          <ThemeProvider>
            <AdminBrandingRoute />
          </ThemeProvider>
        </LocaleProvider>
      </MemoryRouter>,
    )
  })
  await flush()
  return container
}

function buttonByText(text: string) {
  return Array.from(container!.querySelectorAll('button')).find((b) => b.textContent?.trim() === text)
}

function setTextarea(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
  act(() => {
    setter.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

beforeEach(() => {
  stored = {}
  fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/.auth/me')) {
      return jsonResponse({ clientPrincipal: { userDetails: 'admin@example.com', userRoles: ['admin'] } })
    }
    if (url.endsWith('/api/manage/branding')) {
      if (init?.method === 'PUT') {
        stored = JSON.parse(String(init.body))
        return jsonResponse(stored)
      }
      return jsonResponse(stored)
    }
    return jsonResponse({}, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  if (root) act(() => root!.unmount())
  container?.remove()
  root = null
  container = null
})

describe('AdminBrandingRoute', () => {
  it('loads the stored branding into the form', async () => {
    stored = { favicon: SVG, brandmark: { type: 'html', html: '<b>Built by me</b>' } }
    const el = await renderRoute()

    expect(buttonByText(enMessages.adminBrandingFaviconCustom + enMessages.adminBrandingFaviconCustomHint)?.getAttribute('aria-pressed')).toBe('true')
    expect(buttonByText(enMessages.adminBrandingMarkHtml)?.getAttribute('aria-pressed')).toBe('true')
    expect(el.querySelector('textarea')?.value).toBe('<b>Built by me</b>')
    // The live preview renders the sanitized brandmark.
    expect(el.querySelector('footer')?.innerHTML).toContain('<b>Built by me</b>')
  })

  it('saves an html brandmark and shows the result', async () => {
    const el = await renderRoute()
    act(() => buttonByText(enMessages.adminBrandingMarkHtml)!.click())
    setTextarea(el.querySelector('textarea')!, '<a href="https://example.com">Me</a>')

    expect(el.textContent).toContain(enMessages.adminBrandingUnsaved)
    await act(async () => {
      buttonByText(enMessages.adminBrandingSave)!.click()
    })
    await flush()

    const put = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'PUT')!
    expect(JSON.parse(String((put[1] as RequestInit).body))).toEqual({
      brandmark: { type: 'html', html: '<a href="https://example.com">Me</a>' },
    })
    expect((put[1] as RequestInit).headers).toMatchObject({ 'x-cv-admin': '1' })
    expect(el.textContent).toContain(enMessages.adminBrandingSaved)
  })

  it('blocks saving an incomplete brandmark', async () => {
    const el = await renderRoute()
    act(() => buttonByText(enMessages.adminBrandingMarkImage)!.click())

    await act(async () => {
      buttonByText(enMessages.adminBrandingSave)!.click()
    })

    expect(el.textContent).toContain(enMessages.adminBrandingImageRequired)
    expect(fetchMock.mock.calls.some(([, init]) => (init as RequestInit | undefined)?.method === 'PUT')).toBe(false)
  })

  it('discards unsaved changes', async () => {
    const el = await renderRoute()
    act(() => buttonByText(enMessages.adminBrandingMarkHtml)!.click())
    act(() => buttonByText(enMessages.adminBrandingDiscard)!.click())

    expect(buttonByText(enMessages.adminBrandingMarkNone)?.getAttribute('aria-pressed')).toBe('true')
    expect(el.textContent).not.toContain(enMessages.adminBrandingUnsaved)
  })
})
