import type { CvAward } from '../../types/cv'

export function AwardsList({ items }: { items: CvAward[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((a, i) => (
        <article
          key={a.id ?? `${a.title}:${a.issuer ?? ''}:${a.year ?? ''}:${i}`}
          className="rounded-field border border-line bg-surface-muted px-3 py-2.5"
        >
          <h3 className="text-sm font-semibold text-ink">{a.title}</h3>
          {(a.issuer || a.year) ? (
            <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-ink-subtle">
              {a.issuer ? <span>{a.issuer}</span> : null}
              {a.issuer && a.year ? <span aria-hidden="true">·</span> : null}
              {a.year ? <span>{a.year}</span> : null}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  )
}
