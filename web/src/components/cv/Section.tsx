export function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.55)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/35 sm:p-6">
      <div className="flex items-center gap-2.5">
        {icon ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-950/75 dark:text-slate-200">
            {icon}
          </span>
        ) : null}
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
          {title}
        </h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

