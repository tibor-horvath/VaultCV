import type { CvAward } from '../../types/cv'

export function AwardsList({ items }: { items: CvAward[] }) {
  return (
    <div className="space-y-3">
      {items.map((a, i) => (
        <article
          key={a.id ?? `${a.title}:${a.issuer ?? ''}:${a.year ?? ''}:${i}`}
          className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.title}</div>
          {(a.issuer || a.year) ? (
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600 dark:text-slate-400">
              {a.issuer ? <span>{a.issuer}</span> : null}
              {a.year ? <span>{a.year}</span> : null}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}
