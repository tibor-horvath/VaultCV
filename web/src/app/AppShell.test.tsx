import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

vi.mock('../lib/appView', () => ({
  useAppView: () => ({ view: 'cv', openCv: vi.fn(), goHome: vi.fn() }),
}))

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type MockResponse = {
  ok: boolean
  status: number
  json?: () => Promise<unknown>
  text?: () => Promise<string>
}

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

function jsonResponse(body: unknown, status = 200): MockResponse {
  const text = JSON.stringify(body)
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => text,
  }
}

function renderShell(pathname: string) {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [{ path: '*', element: <div>content</div> }],
      },
    ],
    { initialEntries: [pathname] },
  )

  act(() => {
    mountedRoot!.render(
      <RouterProvider router={router} />,
    )
  })
}

function expectMainAndFooterToContain(className: string) {
  const main = document.querySelector('main')
  const footer = document.querySelector('footer')
  expect(main?.className).toContain(className)
  expect(footer?.className).toContain(className)
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({})))
  vi.stubGlobal('scrollTo', vi.fn())
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

describe('AppShell route width behavior', () => {
  it('uses compact width for admin dashboard and footer', () => {
    renderShell('/admin')
    expectMainAndFooterToContain('max-w-6xl')
  })

  it('uses compact width for admin share and footer', () => {
    renderShell('/admin/share')
    expectMainAndFooterToContain('max-w-6xl')
  })

  it('uses wide width for admin editor and footer', () => {
    renderShell('/admin/editor')
    expectMainAndFooterToContain('max-w-[96rem]')
  })
})
