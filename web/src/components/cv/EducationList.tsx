import type { CvEducation } from '../../types/cv'

export function EducationList({ items }: { items: CvEducation[] }) {
  return (
    <div className="space-y-4">
      {items.map((e) => (
        <article
          key={`${e.school}:${e.program}:${e.start ?? ''}`}
          className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/30"
        >
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {e.program} · {e.school}
          </div>
          {e.start || e.end ? (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {e.start ?? ''} {e.start && e.end ? '–' : ''} {e.end ?? ''}
            </div>
          ) : null}
          {e.highlights?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {e.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  )
}

