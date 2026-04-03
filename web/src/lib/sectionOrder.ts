export const SECTION_KEYS = [
  'credentials',
  'skillsLanguages',
  'experience',
  'projects',
  'education',
] as const

export type SectionKey = (typeof SECTION_KEYS)[number]

/**
 * Returns a validated section order array: only known keys are kept, and any
 * missing keys from the canonical set are appended at the end in default order.
 */
export function normalizeSectionOrder(order: unknown): SectionKey[] {
  const knownSet = new Set<string>(SECTION_KEYS)
  const seen = new Set<SectionKey>()
  const result: SectionKey[] = []

  if (Array.isArray(order)) {
    for (const item of order) {
      if (typeof item === 'string' && knownSet.has(item) && !seen.has(item as SectionKey)) {
        result.push(item as SectionKey)
        seen.add(item as SectionKey)
      }
    }
  }

  // Append any missing keys at the end in default order
  for (const key of SECTION_KEYS) {
    if (!seen.has(key)) {
      result.push(key)
    }
  }

  return result
}
