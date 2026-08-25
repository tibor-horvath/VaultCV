/** Joins class names, dropping anything falsy. Keeps conditional variants readable. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
