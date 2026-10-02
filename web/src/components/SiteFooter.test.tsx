import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Brandmark } from '../lib/siteBranding'
import type { ThemePreference } from '../lib/theme'
import { SiteFooter } from './SiteFooter'

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => (key === 'cookieNoticeDetail' ? 'One cookie, {cookie}, only.' : key),
  }),
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const LIGHT = 'data:image/png;base64,TElHSFQ='
const DARK = 'data:image/png;base64,REFSSw=='

let root: Root | null = null
let container: HTMLDivElement | null = null

function render(brandmark: Brandmark | undefined, theme: ThemePreference = 'light') {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(<SiteFooter brandmark={brandmark} theme={theme} />)
  })
  return container
}

afterEach(() => {
  if (root) act(() => root!.unmount())
  container?.remove()
  root = null
  container = null
})

describe('SiteFooter', () => {
  it('renders no brandmark when none is configured', () => {
    const el = render(undefined)
    expect(el.querySelector('img')).toBeNull()
  })

  it('picks the image for the active theme, falling back to the light one', () => {
    const mark: Brandmark = { type: 'image', src: LIGHT, srcDark: DARK, alt: 'Built by me', href: 'https://example.com' }
    expect(render(mark, 'dark').querySelector('img')?.getAttribute('src')).toBe(DARK)
    act(() => root!.unmount())
    container!.remove()

    const el = render({ type: 'image', src: LIGHT }, 'dark')
    expect(el.querySelector('img')?.getAttribute('src')).toBe(LIGHT)
  })

  it('links an image brandmark in a new tab', () => {
    const el = render({ type: 'image', src: LIGHT, alt: 'Built by me', href: 'https://example.com/' })
    const link = el.querySelector('img')!.closest('a')!
    expect(link.getAttribute('href')).toBe('https://example.com/')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(el.querySelector('img')!.getAttribute('alt')).toBe('Built by me')
  })

  it('renders a sanitized html brandmark in the theme variant', () => {
    const el = render({ type: 'html', html: '<b>light</b><script>alert(1)</script>', htmlDark: '<i>dark</i>' }, 'light')
    expect(el.innerHTML).toContain('<b>light</b>')
    expect(el.innerHTML).not.toContain('script')
    act(() => root!.unmount())
    container!.remove()

    expect(render({ type: 'html', html: '<b>light</b>', htmlDark: '<i>dark</i>' }, 'dark').innerHTML).toContain('<i>dark</i>')
  })

  it('collapses the cookie notice into a chip that expands to the full text', () => {
    const el = render(undefined)
    const chip = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('cookieNoticeSummary'))!
    const detail = document.getElementById(chip.getAttribute('aria-controls')!)!
    expect(chip.getAttribute('aria-expanded')).toBe('false')
    expect(detail.hidden).toBe(true)
    expect(detail.querySelector('code')?.textContent).toBe('cv_session')

    act(() => chip.click())
    expect(chip.getAttribute('aria-expanded')).toBe('true')
    expect(detail.hidden).toBe(false)
    expect(detail.textContent).toBe('One cookie, cv_session, only.')
  })
})
