import { ToggleButton } from './ToggleButton'
import { ConfirmButton } from './ConfirmButton'
import { FolderKanban, Link2, Plus, Trash2 } from 'lucide-react'
import type { ProjectRow, PublicProjectFlags } from './types'
import { stringArrayToTextAreaLines, textAreaLinesToStringArray } from './utils'

export function ProjectsSection(props: {
  projects: ProjectRow[]
  setProjects: (updater: (cur: ProjectRow[]) => ProjectRow[]) => void
  publicProjects: PublicProjectFlags[]
  setPublicProjects: (updater: (cur: PublicProjectFlags[]) => PublicProjectFlags[]) => void
  isMobile: boolean
  rowErrors?: string[]
}) {
  const { projects, setProjects, publicProjects, setPublicProjects, isMobile, rowErrors } = props
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <FolderKanban className="h-4 w-4 shrink-0" /> Projects
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setProjects((cur) => [...cur, { name: '', description: '', tags: [], links: [] }])
              setPublicProjects((cur) => [...cur, { name: false, tags: false, description: false }])
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" /> Add
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {projects.map((p, idx) => (
          <details key={idx} open={!isMobile} className="group rounded-xl border border-slate-200/60 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
            <summary className="cursor-pointer list-none text-xs font-semibold text-slate-700 dark:text-slate-300 md:hidden">
              <span className="mr-2 inline-block w-3 text-center transition-transform group-open:rotate-90">{'>'}</span>
              Project {idx + 1}: {(p.name || 'Untitled').slice(0, 60)}
            </summary>
            <div className="mt-2 space-y-2 md:mt-0">
              <div className="flex justify-end">
                <ConfirmButton
                  label="Remove project"
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40"
                  confirmTitle="Remove this project?"
                  confirmDescription="This removes the project and its public visibility settings."
                  confirmLabel="Remove"
                  onConfirm={() => {
                    setProjects((cur) => cur.filter((_, i) => i !== idx))
                    setPublicProjects((cur) => cur.filter((_, i) => i !== idx))
                  }}
                />
              </div>
              {rowErrors?.[idx] ? <div className="text-[11px] text-red-700 dark:text-red-300">{rowErrors[idx]}</div> : null}
              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Name
                  <input
                    value={p.name}
                    onChange={(ev) => setProjects((cur) => cur.map((x, i) => (i === idx ? { ...x, name: ev.target.value } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Name"
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicProjects[idx]?.name)}
                    onClick={() => setPublicProjects((cur) => cur.map((x, i) => (i === idx ? { ...x, name: !x.name } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Tags (one per line)
                  <textarea
                    rows={3}
                    value={stringArrayToTextAreaLines(p.tags ?? [])}
                    onChange={(ev) =>
                      setProjects((cur) => cur.map((x, i) => (i === idx ? { ...x, tags: textAreaLinesToStringArray(ev.target.value) } : x)))
                    }
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 font-mono text-[12px] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicProjects[idx]?.tags)}
                    onClick={() => setPublicProjects((cur) => cur.map((x, i) => (i === idx ? { ...x, tags: !x.tags } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Description
                  <textarea
                    rows={4}
                    value={p.description}
                    onChange={(ev) => setProjects((cur) => cur.map((x, i) => (i === idx ? { ...x, description: ev.target.value } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicProjects[idx]?.description)}
                    onClick={() => setPublicProjects((cur) => cur.map((x, i) => (i === idx ? { ...x, description: !x.description } : x)))}
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-slate-200/60 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Link2 className="h-3.5 w-3.5 shrink-0" /> Project links (private only)
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProjects((cur) =>
                        cur.map((x, i) =>
                          i === idx ? { ...x, links: [...(x.links ?? []), { label: '', url: '' }] } : x,
                        ),
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300/70 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" /> Add link
                  </button>
                </div>
                <div className="space-y-2">
                  {(p.links ?? []).map((link, linkIdx) => (
                    <div key={linkIdx} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200/60 p-2 dark:border-slate-800 md:grid-cols-[1fr_1fr_auto]">
                      <input
                        value={link.label}
                        onChange={(ev) =>
                          setProjects((cur) =>
                            cur.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    links: (x.links ?? []).map((lx, li) => (li === linkIdx ? { ...lx, label: ev.target.value } : lx)),
                                  }
                                : x,
                            ),
                          )
                        }
                        className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="Label"
                      />
                      <input
                        value={link.url}
                        onChange={(ev) =>
                          setProjects((cur) =>
                            cur.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    links: (x.links ?? []).map((lx, li) => (li === linkIdx ? { ...lx, url: ev.target.value } : lx)),
                                  }
                                : x,
                            ),
                          )
                        }
                        className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="https://..."
                      />
                      <ConfirmButton
                        label="Remove"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40"
                        confirmTitle="Remove this project link?"
                        confirmDescription="This removes only this link from the current project."
                        confirmLabel="Remove"
                        onConfirm={() =>
                          setProjects((cur) =>
                            cur.map((x, i) =>
                              i === idx ? { ...x, links: (x.links ?? []).filter((_, li) => li !== linkIdx) } : x,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

