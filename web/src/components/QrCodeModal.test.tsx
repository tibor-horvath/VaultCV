import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../lib/i18n'
import { QrCodeModal } from './QrCodeModal'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('qrcode.react', async () => {
  const { forwardRef, createElement } = await import('react')
  return {
    QRCodeCanvas: forwardRef<HTMLCanvasElement>(
      (_: unknown, ref) => createElement('canvas', { ref }),
    ),
  }
})

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

const multiLangOptions = [
  { value: '', label: 'Auto' },
  { value: 'en', label: 'EN - English' },
  { value: 'de', label: 'DE - Deutsch' },
]

type RenderOptions = {
  initialLang?: string
  langOptions?: typeof multiLangOptions
}

function renderModal(shareUrlBase: string, onClose = vi.fn(), opts: RenderOptions = {}) {
  const { initialLang = '', langOptions = multiLangOptions } = opts
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => {
    mountedRoot!.render(
      <LocaleProvider>
        <QrCodeModal
          shareUrlBase={shareUrlBase}
          initialLang={initialLang}
          langOptions={langOptions}
          onClose={onClose}
        />
      </LocaleProvider>,
    )
  })
  return onClose
}

afterEach(() => {
  if (mountedRoot && mountedContainer) {
    act(() => {
      mountedRoot!.unmount()
    })
    mountedContainer.remove()
  }
  mountedRoot = null
  mountedContainer = null
})

describe('QrCodeModal', () => {
  it('renders with role="dialog" and aria-modal="true"', () => {
    renderModal('https://example.com/?s=abc123')
    const dialog = document.querySelector('[role="dialog"]') as HTMLDivElement
    expect(dialog).toBeTruthy()
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('includes the URL in the aria-label', () => {
    const url = 'https://example.com/?s=abc123'
    renderModal(url)
    const dialog = document.querySelector('[role="dialog"]') as HTMLDivElement
    expect(dialog.getAttribute('aria-label')).toContain(url)
  })

  it('shows the share URL as readable text', () => {
    const url = 'https://example.com/?s=abc123'
    renderModal(url)
    expect(document.body.textContent).toContain(url)
  })

  it('has a Download PNG button', () => {
    renderModal('https://example.com/?s=abc123')
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Download PNG'),
    )
    expect(btn).toBeTruthy()
  })

  it('has a Close button', () => {
    renderModal('https://example.com/?s=abc123')
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Close',
    )
    expect(btn).toBeTruthy()
  })

  it('calls onClose when Close button is clicked', () => {
    const onClose = renderModal('https://example.com/?s=abc123')
    const closeBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Close',
    ) as HTMLButtonElement
    act(() => {
      closeBtn.click()
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = renderModal('https://example.com/?s=abc123')
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking the backdrop', () => {
    const onClose = renderModal('https://example.com/?s=abc123')
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLDivElement
    expect(backdrop).toBeTruthy()
    act(() => {
      backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows language selector when multiple locales are provided', () => {
    renderModal('https://example.com/?s=abc123')
    expect(document.querySelector('select')).toBeTruthy()
  })

  it('hides language selector when only one locale option is provided', () => {
    renderModal('https://example.com/?s=abc123', vi.fn(), {
      langOptions: [{ value: '', label: 'Auto' }],
    })
    expect(document.querySelector('select')).toBeNull()
  })

  it('hides language selector when Auto and a single real locale are provided', () => {
    renderModal('https://example.com/?s=abc123', vi.fn(), {
      langOptions: [
        { value: '', label: 'Auto' },
        { value: 'en', label: 'EN - English' },
      ],
    })
    expect(document.querySelector('select')).toBeNull()
  })

  it('updates displayed URL when language is changed', () => {
    renderModal('https://example.com/?s=abc123')
    const select = document.querySelector('select') as HTMLSelectElement

    act(() => {
      select.value = 'de'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(document.body.textContent).toContain('lang=de')
  })

  it('seeds language selector from initialLang', () => {
    renderModal('https://example.com/?s=abc123', vi.fn(), { initialLang: 'en' })
    const select = document.querySelector('select') as HTMLSelectElement
    expect(select.value).toBe('en')
    expect(document.body.textContent).toContain('lang=en')
  })

  it('shows Share image button when navigator.canShare and navigator.share are available', () => {
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn(() => true),
      configurable: true,
      writable: true,
    })
    Object.defineProperty(navigator, 'share', {
      value: vi.fn(async () => {}),
      configurable: true,
      writable: true,
    })
    renderModal('https://example.com/?s=abc123')
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Share image'),
    )
    expect(btn).toBeTruthy()
    delete (navigator as Partial<Navigator>).canShare
    delete (navigator as Partial<Navigator>).share
  })

  it('hides Share image button when navigator.canShare is not available', () => {
    const desc = Object.getOwnPropertyDescriptor(navigator, 'canShare')
    if (desc) {
      Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true, writable: true })
    }
    renderModal('https://example.com/?s=abc123')
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Share image'),
    )
    expect(btn).toBeUndefined()
    if (desc) Object.defineProperty(navigator, 'canShare', desc)
  })

  it('hides Share image button when navigator.share is not available', () => {
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn(() => true),
      configurable: true,
      writable: true,
    })
    const shareDesc = Object.getOwnPropertyDescriptor(navigator, 'share')
    if (shareDesc) {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true, writable: true })
    }
    renderModal('https://example.com/?s=abc123')
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Share image'),
    )
    expect(btn).toBeUndefined()
    delete (navigator as Partial<Navigator>).canShare
    if (shareDesc) Object.defineProperty(navigator, 'share', shareDesc)
  })

  it('calls navigator.share with a PNG file when Share image is clicked', async () => {
    const toBlobSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback: (blob: Blob | null) => void) => {
        callback(new Blob(['fake'], { type: 'image/png' }))
      })
    const shareMock = vi.fn(async () => {})
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn(() => true),
      configurable: true,
      writable: true,
    })
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
      writable: true,
    })
    renderModal('https://example.com/?s=abc123')
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Share image'),
    ) as HTMLButtonElement
    expect(btn).toBeTruthy()
    await act(async () => {
      btn.click()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(shareMock).toHaveBeenCalledTimes(1)
    const payload = (shareMock.mock.calls as unknown as [{ files?: File[] }][])[0][0]
    expect(payload.files).toHaveLength(1)
    expect(payload.files![0].name).toBe('qr-code.png')
    toBlobSpy.mockRestore()
    delete (navigator as Partial<Navigator>).canShare
    delete (navigator as Partial<Navigator>).share
  })
})
