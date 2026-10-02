export function hasText(value: string | undefined | null): value is string {
  return value != null && String(value).trim() !== ''
}

/** Inline lists (skills, tags, sub-details) read as one line of text rather than ink-heavy pills. */
export function joinDot(items: (string | undefined | null)[]): string {
  return items
    .filter(hasText)
    .map((v) => v.trim())
    .join(' · ')
}

/** Up to two initials, e.g. "Horváth Tibor" → "HT". Used when there is no photo to print. */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .join('')
}

/**
 * `"English (C1)"` → `{ name: 'English', level: 'C1' }`. Languages are free text in the CV schema;
 * the trailing parenthetical is the conventional place for a level. Anything else is all name.
 */
export function splitLanguageLevel(value: string): { name: string; level?: string } {
  const trimmed = value.trim()
  const m = /^(.+?)\s*\(([^()]+)\)$/.exec(trimmed)
  if (!m) return { name: trimmed }
  return { name: m[1]!.trim(), level: m[2]!.trim() }
}
