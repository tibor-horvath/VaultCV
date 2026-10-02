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
