export function SkillsChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <span
          key={s}
          className="rounded-md border border-slate-200/80 bg-slate-100/90 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/70 dark:border-slate-600/55 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:bg-slate-800/85"
        >
          {s}
        </span>
      ))}
    </div>
  )
}

