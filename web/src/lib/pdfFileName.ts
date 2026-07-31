/** C0 controls and DEL, which are illegal in file names on every platform we target. */
function stripControlChars(value: string): string {
  let out = ''
  for (const ch of value) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp < 0x20 || cp === 0x7f) continue
    out += ch
  }
  return out
}

/**
 * Windows/macOS-safe download file name. Letters, marks and digits from any script are kept
 * (so `Horváth Ákos CV` survives), everything path-hostile is folded to `_`.
 */
export function sanitizePdfFileBaseName(fileBaseName: string): string {
  const normalized = fileBaseName.normalize('NFKC').trim()
  const noControls = stripControlChars(normalized)
  const noForbidden = noControls.replace(/[<>:"/\\|?*]+/g, '_')
  const compacted = noForbidden.replace(/\s+/g, ' ').replace(/_+/g, '_').trim()
  const safeEdges = compacted.replace(/[. ]+$/g, '').replace(/^[. ]+/g, '')
  const safe = safeEdges.replace(/[^\p{L}\p{M}\p{N} _.-]+/gu, '_').replace(/_+/g, '_').trim()
  return safe.slice(0, 80) || 'cv'
}
