export type DownloadCvPdfServerOptions = {
  fileBaseName?: string
  locale: string
}

export type DownloadCvPdfServerResult = { ok: true } | { ok: false; error: string }

/**
 * Fetches the server-generated (text-searchable) PDF from `/api/cv-pdf` and
 * triggers a browser download. Requires the session cookie to be set.
 */
export async function downloadCvPdfServer({
  fileBaseName = 'cv',
  locale,
}: DownloadCvPdfServerOptions): Promise<DownloadCvPdfServerResult> {
  let res: Response
  try {
    res = await fetch('/api/cv-pdf', {
      method: 'GET',
      headers: { 'accept-language': locale },
      credentials: 'same-origin',
    })
  } catch {
    return { ok: false, error: 'Network error.' }
  }

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status}).`
    try {
      const body = (await res.json()) as { error?: string }
      if (typeof body?.error === 'string' && body.error) {
        errorMsg = body.error
      }
    } catch {
      // ignore JSON parse errors
    }
    return { ok: false, error: errorMsg }
  }

  let blob: Blob
  try {
    blob = await res.blob()
  } catch {
    return { ok: false, error: 'Failed to read PDF response.' }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileBaseName}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  return { ok: true }
}
