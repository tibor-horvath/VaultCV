import type { CvProject } from '../../types/cv'

export function ProjectsGrid({ items }: { items: CvProject[] }) {
  return (
    <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
      {items.map((p) => (
        <article
          key={p.name}
          className="py-3.5"
        >
          <div className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{p.description}</p>
          {p.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-slate-200/90 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-700/80 dark:bg-slate-950/75 dark:text-slate-200"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          {p.links?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {p.links.map((l) => (
                <a
                  key={`${p.name}:${l.url}`}
                  className="text-xs font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {l.label}
                </a>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}

