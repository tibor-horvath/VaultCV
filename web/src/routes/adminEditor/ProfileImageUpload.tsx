import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2, X, Check, ZoomIn, ZoomOut } from 'lucide-react'
import { useI18n } from '../../lib/i18n'

const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MB
const OUTPUT_SIZE = 512
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

type UploadState = 'idle' | 'uploading' | 'error'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

interface CropModalProps {
  imageFile: File
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

function CropModal({ imageFile, onConfirm, onCancel }: CropModalProps) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [sourceImage, setSourceImage] = useState<ImageBitmap | null>(null)
  // displaySize: pixel dimensions of the image at scale=1 (cover-fits the frame)
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null)

  // Constrain offset so the image always fills the crop frame.
  // baseW/baseH are the display pixel dimensions of the image at scale=1.
  function constrainOffset(ox: number, oy: number, s: number, baseW: number, baseH: number, frameSize: number): { x: number; y: number } {
    const scaledW = baseW * s
    const scaledH = baseH * s
    const maxX = Math.max(0, (scaledW - frameSize) / 2)
    const maxY = Math.max(0, (scaledH - frameSize) / 2)
    return { x: clamp(ox, -maxX, maxX), y: clamp(oy, -maxY, maxY) }
  }

  function getFrameSize() {
    return containerRef.current?.clientWidth ?? 320
  }

  useEffect(() => {
    let isActive = true

    void createImageBitmap(imageFile)
      .then((bitmap) => {
        if (!isActive) {
          bitmap.close()
          return
        }

        const frameSize = getFrameSize()
        const bs = Math.max(frameSize / bitmap.width, frameSize / bitmap.height)
        setSourceImage((current) => {
          current?.close()
          return bitmap
        })
        setDisplaySize({ w: bitmap.width * bs, h: bitmap.height * bs })
        setScale(1)
        setOffset({ x: 0, y: 0 })
      })
      .catch(() => {
        if (!isActive) return
        setSourceImage((current) => {
          current?.close()
          return null
        })
        setDisplaySize(null)
      })

    return () => {
      isActive = false
    }
  }, [imageFile])

  useEffect(() => {
    return () => {
      sourceImage?.close()
    }
  }, [sourceImage])

  useEffect(() => {
    const canvas = canvasRef.current
    const frameSize = getFrameSize()
    if (!canvas) return

    const pixelRatio = window.devicePixelRatio || 1
    const pixelSize = Math.max(1, Math.round(frameSize * pixelRatio))
    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize
      canvas.height = pixelSize
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, pixelSize, pixelSize)
    if (!sourceImage || !displaySize) return

    const scaleRatio = pixelSize / frameSize
    const scaledW = displaySize.w * scale * scaleRatio
    const scaledH = displaySize.h * scale * scaleRatio
    const imgLeft = ((frameSize - displaySize.w * scale) / 2 + offset.x) * scaleRatio
    const imgTop = ((frameSize - displaySize.h * scale) / 2 + offset.y) * scaleRatio

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(sourceImage, imgLeft, imgTop, scaledW, scaledH)
  }, [displaySize, offset.x, offset.y, scale, sourceImage])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffsetX: offset.x, startOffsetY: offset.y }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !sourceImage || !displaySize) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const frameSize = getFrameSize()
    const constrained = constrainOffset(
      dragRef.current.startOffsetX + dx,
      dragRef.current.startOffsetY + dy,
      scale,
      displaySize.w,
      displaySize.h,
      frameSize,
    )
    setOffset(constrained)
  }

  function handlePointerUp() {
    dragRef.current = null
  }

  function handleScaleChange(newScale: number) {
    if (!displaySize) return
    const frameSize = getFrameSize()
    const constrained = constrainOffset(offset.x, offset.y, newScale, displaySize.w, displaySize.h, frameSize)
    setScale(newScale)
    setOffset(constrained)
  }

  function handleConfirm() {
    if (!sourceImage || !displaySize) return
    const frameSize = getFrameSize()
    // effectiveScale maps display pixels → natural pixels inverse
    // At scale=1, image renders at displaySize.w × displaySize.h pixels
    const baseRatio = sourceImage.width / displaySize.w // natural pixels per display pixel at scale=1
    const effectiveDisplayScale = scale // CSS scale multiplier on top of baseRatio
    const scaledW = displaySize.w * effectiveDisplayScale
    const scaledH = displaySize.h * effectiveDisplayScale
    // Top-left of the scaled image in frame coords
    const imgLeft = (frameSize - scaledW) / 2 + offset.x
    const imgTop = (frameSize - scaledH) / 2 + offset.y
    // Crop rect in natural image coords
    const sx = Math.max(0, (-imgLeft * baseRatio) / effectiveDisplayScale)
    const sy = Math.max(0, (-imgTop * baseRatio) / effectiveDisplayScale)
    const sw = Math.min(sourceImage.width - sx, (frameSize * baseRatio) / effectiveDisplayScale)
    const sh = Math.min(sourceImage.height - sy, (frameSize * baseRatio) / effectiveDisplayScale)

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob)
      },
      'image/jpeg',
      0.9,
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={t('adminCropProfilePhoto')}>
      <div className="flex w-full max-w-xs flex-col gap-4 rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{t('adminCropPhoto')}</span>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            aria-label={t('adminCancelCrop')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crop frame */}
        <div
          ref={containerRef}
          className="relative aspect-square w-full cursor-grab overflow-hidden rounded-full border-2 border-emerald-500 active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {sourceImage ? <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" /> : null}
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleScaleChange(Math.max(1, scale - 0.1))}
            className="rounded p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            aria-label={t('adminZoomOut')}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={scale}
            onChange={(e) => handleScaleChange(Number(e.target.value))}
            className="flex-1 accent-emerald-500"
            aria-label={t('adminZoomLevel')}
          />
          <button
            type="button"
            onClick={() => handleScaleChange(Math.min(3, scale + 0.1))}
            className="rounded p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            aria-label={t('adminZoomIn')}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-300/70 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t('adminCancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Check className="h-3.5 w-3.5" /> {t('adminApply')}
          </button>
        </div>
      </div>
    </div>
  )
}

interface ProfileImageUploadProps {
  hasProfileImage: boolean
  onChange: (hasImage: boolean) => void
}

export function ProfileImageUpload({ hasProfileImage, onChange }: ProfileImageUploadProps) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<ImageBitmap | null>(null)
  const [previewVersion, setPreviewVersion] = useState(0)

  useEffect(() => {
    return () => {
      previewImage?.close()
    }
  }, [previewImage])

  useEffect(() => {
    if (!hasProfileImage) {
      setPreviewImage((current) => {
        current?.close()
        return null
      })
      return
    }

    let isActive = true

    void (async () => {
      try {
        const res = await fetch(`/api/manage/profile/image?_=${previewVersion}`, {
          method: 'GET',
          credentials: 'same-origin',
        })
        if (!res.ok) {
          throw new Error(`Preview failed (${res.status})`)
        }

        const contentType = (res.headers.get('content-type') ?? '').toLowerCase()
        if (!ALLOWED_TYPES.includes(contentType)) {
          throw new Error('Unexpected image content type.')
        }

        const blob = await res.blob()
        const bitmap = await createImageBitmap(blob)
        if (!isActive) {
          bitmap.close()
          return
        }

        setPreviewImage((current) => {
          current?.close()
          return bitmap
        })
      } catch {
        if (!isActive) return
        setPreviewImage((current) => {
          current?.close()
          return null
        })
      }
    })()

    return () => {
      isActive = false
    }
  }, [hasProfileImage, previewVersion])

  useEffect(() => {
    const canvas = previewCanvasRef.current
    if (!canvas) return

    const frameSize = canvas.parentElement?.clientWidth ?? 56
    const pixelRatio = window.devicePixelRatio || 1
    const pixelSize = Math.max(1, Math.round(frameSize * pixelRatio))
    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize
      canvas.height = pixelSize
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, pixelSize, pixelSize)
    if (!previewImage) return

    const bs = Math.max(frameSize / previewImage.width, frameSize / previewImage.height)
    const drawW = previewImage.width * bs * pixelRatio
    const drawH = previewImage.height * bs * pixelRatio

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(previewImage, (pixelSize - drawW) / 2, (pixelSize - drawH) / 2, drawW, drawH)
  }, [previewImage])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so same file can be re-selected
    e.target.value = ''
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(t('adminImageTypeError'))
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError(t('adminImageSizeError'))
      return
    }
    setUploadError(null)
    setCropFile(file)
  }

  async function handleCropConfirm(blob: Blob) {
    setCropFile(null)
    setUploadState('uploading')
    setUploadError(null)
    try {
      // Convert blob → base64 to avoid binary body transport issues with Azure SWA managed functions
      const arrayBuffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
      const base64 = btoa(binary)

      const res = await fetch('/api/manage/profile/image', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
          'x-cv-admin': '1',
        },
        body: JSON.stringify({ data: base64, mimeType: blob.type }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Upload failed (${res.status})`)
      }
      setPreviewVersion(Date.now())
      onChange(true)
      setUploadState('idle')
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : t('adminUploadFailed'))
      setUploadState('error')
    }
  }

  function handleCropCancel() {
    setCropFile(null)
  }

  async function handleDelete() {
    setUploadState('uploading')
    setUploadError(null)
    try {
      const res = await fetch('/api/manage/profile/image', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'x-cv-admin': '1' },
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Delete failed (${res.status})`)
      }
      setPreviewImage((current) => {
        current?.close()
        return null
      })
      onChange(false)
      setUploadState('idle')
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : t('adminDeleteFailed'))
      setUploadState('error')
    }
  }

  const isLoading = uploadState === 'uploading'

  return (
    <>
      {cropFile ? <CropModal imageFile={cropFile} onConfirm={handleCropConfirm} onCancel={handleCropCancel} /> : null}

      <div className="flex items-center gap-3">
        {/* Circular preview */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
          {previewImage ? (
            <canvas
              ref={previewCanvasRef}
              aria-label={t('adminProfilePhotoPreview')}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
              <Camera className="h-5 w-5" />
            </div>
          )}
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-slate-300/70 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {hasProfileImage ? t('adminChangePhoto') : t('adminUploadPhoto')}
            </button>
            {hasProfileImage ? (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleDelete}
                className="rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-slate-950 dark:text-red-400 dark:hover:bg-red-950"
                aria-label={t('adminRemovePhoto')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('adminProfilePhotoRequirements')}</p>
          {uploadError ? <p className="text-[11px] text-red-700 dark:text-red-300">{uploadError}</p> : null}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="sr-only" onChange={handleFileChange} />
    </>
  )
}
