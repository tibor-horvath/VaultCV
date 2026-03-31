export function safeSlugFromName(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
  return normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .replace(/-+/g, '-')
}

export function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((x) => typeof x === 'string') : []
}

export function asObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

export function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

export function textAreaLinesToStringArray(text: string) {
  return text
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
}

export function stringArrayToTextAreaLines(arr: string[]) {
  return arr.join('\n')
}

export function safeJsonParse<T>(text: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) as T }
  } catch {
    return { ok: false, error: 'Invalid JSON returned by server.' }
  }
}

export async function readJsonResponse<T>(
  res: Response,
): Promise<{ ok: true; value: T } | { ok: false; error: string; empty?: boolean }> {
  const text = await res.text()
  if (!text.trim()) return { ok: false, error: 'Empty response returned by server.', empty: true }
  const parsed = safeJsonParse<T>(text)
  if (!parsed.ok) return { ok: false, error: parsed.error }
  return { ok: true, value: parsed.value }
}

