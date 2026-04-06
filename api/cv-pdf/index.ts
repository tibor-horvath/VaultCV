import { firstLanguageTagFromAcceptLanguage, getHeaderInsensitive } from '../lib/httpHeaders'
import { normalizeLocale } from '../lib/localeRegistry'
import { readProfileJsonV2 } from '../lib/profileBlobStore'
import { getSigningSecret, readAccessToken, verifySessionToken } from '../lib/sessionAuth'
import { validateShareLink } from '../lib/shareLinksTable'
import { buildCvPdfBuffer } from '../lib/cvPdfDocument'

type Context = {
  log: (...args: unknown[]) => void
  res?: {
    status: number
    headers?: Record<string, string>
    body?: unknown
    isRaw?: boolean
  }
}

type HttpRequest = {
  query?: Record<string, string | undefined>
  headers?: Record<string, string | undefined>
}

function readServerConfiguredProfileSlug() {
  return (process.env.CV_PROFILE_SLUG ?? '').trim()
}

function jsonError(status: number, message: string) {
  return {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body: { error: message },
  }
}

export default async function (context: Context, req: HttpRequest) {
  const tokenRead = readAccessToken(req.headers)
  const accessToken = tokenRead.token
  const acceptLanguage = getHeaderInsensitive(req.headers, 'accept-language')
  const requestedLocale = normalizeLocale(firstLanguageTagFromAcceptLanguage(acceptLanguage))

  const signingSecret = getSigningSecret()
  if (!signingSecret) {
    context.res = jsonError(500, 'Server is not configured.')
    return
  }

  const tokenVerification = verifySessionToken(accessToken)
  if (!tokenVerification.ok) {
    context.log('Unauthorized /api/cv-pdf request', { reason: tokenVerification.reason })
    context.res = jsonError(401, 'Unauthorized')
    return
  }

  if (!tokenVerification.shareId) {
    context.log('Unauthorized /api/cv-pdf request: token missing shareId')
    context.res = jsonError(401, 'Unauthorized')
    return
  }

  let shareLinkValidation: Awaited<ReturnType<typeof validateShareLink>>
  try {
    shareLinkValidation = await validateShareLink(tokenVerification.shareId)
  } catch (err) {
    context.log('Error validating share link for /api/cv-pdf', { shareId: tokenVerification.shareId, err })
    context.res = jsonError(500, 'Internal server error.')
    return
  }
  if (!shareLinkValidation.ok) {
    context.log('Unauthorized /api/cv-pdf request: share link invalid', {
      reason: shareLinkValidation.reason,
      shareId: tokenVerification.shareId,
    })
    context.res = jsonError(401, 'Unauthorized')
    return
  }

  const slug = readServerConfiguredProfileSlug()
  if (!slug) {
    context.res = jsonError(500, 'CV data is not configured.')
    return
  }

  let raw = ''
  try {
    raw = await readProfileJsonV2({ kind: 'private', locale: requestedLocale, slugFromName: slug, legacyFallback: false })
  } catch (err) {
    context.log('Failed loading PRIVATE_PROFILE payload for /api/cv-pdf', err)
    context.res = jsonError(502, 'CV data could not be loaded.')
    return
  }

  if (!raw.trim()) {
    context.res = jsonError(404, 'CV data is not configured.')
    return
  }

  let cvData: Record<string, unknown>
  try {
    cvData = JSON.parse(raw) as Record<string, unknown>
  } catch {
    context.res = jsonError(500, 'CV data is invalid JSON.')
    return
  }

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await buildCvPdfBuffer(cvData as Parameters<typeof buildCvPdfBuffer>[0])
  } catch (err) {
    context.log('Failed generating PDF for /api/cv-pdf', err)
    context.res = jsonError(500, 'PDF generation failed.')
    return
  }

  const rawName = (cvData as { basics?: { name?: unknown } }).basics?.name
  const baseName = typeof rawName === 'string' ? rawName.trim().replace(/\s+/g, '-') : 'cv'
  const name = sanitizeFilename(baseName)

  context.res = {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${name}.pdf"`,
      'cache-control': 'no-store',
    },
    body: pdfBuffer,
    isRaw: true,
  }
}

function sanitizeFilename(name: string): string {
  const safe = name
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/[. ]+$/g, '')
    .slice(0, 80)
  return safe || 'cv'
}
