import { Eye, EyeOff } from 'lucide-react'

export function ToggleButton(props: { pressed: boolean; onClick: () => void; title?: string; label?: string }) {
  const { pressed, onClick } = props
  const label = (props.label ?? '').trim()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold ${
        pressed
          ? 'border-emerald-400/60 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60'
          : 'border-red-300/70 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60'
      }`}
      title={props.title ?? (pressed ? 'Public' : 'Private')}
    >
      {pressed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      {label ? <span className="text-slate-700/80 dark:text-slate-200/80">{label}</span> : null}
      <span>{pressed ? 'Public' : 'Private'}</span>
    </button>
  )
}

