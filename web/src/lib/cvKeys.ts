import type { CvEducation, CvExperience } from '../types/cv'

const SEP = '\u0001'

export function stableExperienceKey(x: CvExperience): string {
  if (x.id != null && x.id !== '') return x.id
  return ['exp', x.company, x.role, x.start, x.end ?? '', x.location ?? ''].join(SEP)
}

export function stableEducationKey(e: CvEducation): string {
  if (e.id != null && e.id !== '') return e.id
  return ['edu', e.school, e.program, e.start ?? '', e.end ?? '', e.location ?? ''].join(SEP)
}

/** Keys for highlight `<li>` siblings under a stable parent row key. */
export function highlightChildKey(parentRowKey: string, index: number): string {
  return `${parentRowKey}::h::${index}`
}
