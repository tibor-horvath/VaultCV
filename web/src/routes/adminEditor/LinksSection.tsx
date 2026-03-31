import { ToggleButton } from './ToggleButton'
import { ConfirmButton } from './ConfirmButton'
import { Link2, Plus, Trash2 } from 'lucide-react'
import type { LinkRow, PublicLinkFlags } from './types'

export function LinksSection(props: {
  links: LinkRow[]
  setLinks: (updater: (cur: LinkRow[]) => LinkRow[]) => void
  publicLinks: PublicLinkFlags[]
  setPublicLinks: (updater: (cur: PublicLinkFlags[]) => PublicLinkFlags[]) => void
  isMobile: boolean
  rowErrors?: string[]
}) {
  const { links, setLinks, publicLinks, setPublicLinks, isMobile, rowErrors } = props
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Link2 className="h-4 w-4 shrink-0" /> Links
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLinks((cur) => [...cur, { label: '', url: '' }])
              setPublicLinks((cur) => [...cur, { label: false, url: false }])
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" /> Add
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {links.map((l, idx) => (
          <details key={idx} open={!isMobile} className="group rounded-xl border border-slate-200/60 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-950/20">
            <summary className="cursor-pointer list-none text-xs font-semibold text-slate-700 dark:text-slate-300 md:hidden">
              <span className="mr-2 inline-block w-3 text-center transition-transform group-open:rotate-90">{'>'}</span>
              Link {idx + 1}: {(l.label || l.url || 'Untitled').slice(0, 60)}
            </summary>
            <div className="mt-2 space-y-2 md:mt-0">
              <div className="flex justify-end">
                <ConfirmButton
                  label="Remove link"
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40"
                  confirmTitle="Remove this link?"
                  confirmDescription="This removes the link and its public visibility settings."
                  confirmLabel="Remove"
                  onConfirm={() => {
                    setLinks((cur) => cur.filter((_, i) => i !== idx))
                    setPublicLinks((cur) => cur.filter((_, i) => i !== idx))
                  }}
                />
              </div>
              {rowErrors?.[idx] ? <div className="text-[11px] text-red-700 dark:text-red-300">{rowErrors[idx]}</div> : null}
              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Label
                  <input
                    value={l.label}
                    onChange={(e) => setLinks((cur) => cur.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="GitHub"
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicLinks[idx]?.label)}
                    onClick={() => setPublicLinks((cur) => cur.map((x, i) => (i === idx ? { ...x, label: !x.label } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  URL
                  <input
                    value={l.url}
                    onChange={(e) => setLinks((cur) => cur.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="https://..."
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicLinks[idx]?.url)}
                    onClick={() => setPublicLinks((cur) => cur.map((x, i) => (i === idx ? { ...x, url: !x.url } : x)))}
                  />
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

