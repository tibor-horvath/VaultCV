import { act, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileImageUpload } from './ProfileImageUpload'
import { LocaleProvider } from '../../lib/i18n'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type BitmapStub = Pick<ImageBitmap, 'width' | 'height' | 'close'>

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null
let fetchMock: ReturnType<typeof vi.fn>
let createImageBitmapMock: ReturnType<typeof vi.fn>

function makeBitmap(width = 320, height = 240): BitmapStub {
  return {
    width,
    height,
    close: vi.fn(),
  }
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json; charset=utf-8' },
    json: async () => body,
    blob: async () => new Blob(),
  }
}

function imageResponse() {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'image/jpeg' },
    json: async () => ({}),
    blob: async () => new Blob(['image-bytes'], { type: 'image/jpeg' }),
  }
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

function renderUpload(props: Partial<ComponentProps<typeof ProfileImageUpload>> = {}) {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)

  const onChange = props.onChange ?? vi.fn()

  act(() => {
    mountedRoot!.render(
      <LocaleProvider>
        <ProfileImageUpload hasProfileImage={props.hasProfileImage ?? false} onChange={onChange} />
      </LocaleProvider>,
    )
  })

  return { onChange }
}

beforeEach(() => {
  fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if ((init?.method ?? 'GET') === 'GET' && url.includes('/api/manage/profile/image')) {
      return imageResponse()
    }
    return jsonResponse({}, 404)
  })
  vi.stubGlobal('fetch', fetchMock)

  createImageBitmapMock = vi.fn(async () => makeBitmap())
  vi.stubGlobal('createImageBitmap', createImageBitmapMock)

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () =>
      ({
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
      }) as unknown as CanvasRenderingContext2D,
  )
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

describe('ProfileImageUpload', () => {
  it('rejects unsupported file types before opening the crop modal', async () => {
    renderUpload()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const badFile = new File(['bad'], 'avatar.gif', { type: 'image/gif' })

    Object.defineProperty(input, 'files', { value: [badFile], configurable: true })
    act(() => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await flushEffects()

    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(createImageBitmapMock).not.toHaveBeenCalled()
  })

  it('opens the crop modal and renders the selected file through a canvas', async () => {
    renderUpload()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['png'], 'avatar.png', { type: 'image/png' })

    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    act(() => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await flushEffects()

    const dialog = document.querySelector('[role="dialog"]') as HTMLDivElement
    expect(dialog).toBeTruthy()
    expect(createImageBitmapMock).toHaveBeenCalledWith(file)
    expect(dialog.querySelector('canvas')).toBeTruthy()
    expect(dialog.querySelector('img')).toBeNull()
  })

  it('renders an existing profile preview through a canvas after fetching the image blob', async () => {
    renderUpload({ hasProfileImage: true })
    await flushEffects()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/manage/profile/image?_='),
      expect.objectContaining({ method: 'GET', credentials: 'same-origin' }),
    )

    const previewCanvas = document.querySelector('canvas[aria-label]') as HTMLCanvasElement
    expect(previewCanvas).toBeTruthy()
    expect(document.querySelector('img')).toBeNull()
  })
})
