import { Eye, EyeOff } from 'lucide-react'

export function ToggleButton(props: { pressed: boolean; onClick: () => void; title?: string }) {
  const { pressed, onClick } = props
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold ${
        pressed
          ? 'border-emerald-400/60 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60'
          : 'border-slate-300/70 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900/60'
      }`}
      title={props.title ?? (pressed ? 'Public' : 'Private')}
    >
      {pressed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} Public
    </button>
  )
}

