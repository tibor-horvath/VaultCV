import { ToggleButton } from './ToggleButton'
import { ConfirmButton } from './ConfirmButton'
import { FolderKanban, Link2, Plus, Trash2 } from 'lucide-react'
import type { ProjectRow, PublicProjectFlags } from './types'
import { SiAppstoreIcon, SiGithubIcon, SiGitlabIcon, SiGoogleplayIcon, SiNpmIcon, SiPypiIcon, SiYoutubeIcon } from '../../components/icons/SimpleBrandIcons'
import { IconSelect } from './IconSelect'
import { useI18n } from '../../lib/i18n'
import { useEffect, useState } from 'react'
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableRow } from './SortableRow'
import { DragHandle } from './DragHandle'
import { ChipListEditor } from './ChipListEditor'

const PROJECT_LINK_LABEL_OPTIONS = ['demo', 'github', 'gitlab', 'docs', 'video', 'case-study', 'npm', 'pypi', 'app-store', 'play-store'] as const
const CUSTOM_OPTION = '__custom__'

export function ProjectsSection(props: {
  projects: ProjectRow[]
  setProjects: (updater: (cur: ProjectRow[]) => ProjectRow[]) => void
  publicProjects: PublicProjectFlags[]
  setPublicProjects: (updater: (cur: PublicProjectFlags[]) => PublicProjectFlags[]) => void
  isMobile: boolean
  rowErrors?: string[]
}) {
  const { t } = useI18n()
  const { projects, setProjects, publicProjects, setPublicProjects, isMobile, rowErrors } = props

  const [lastAddedId, setLastAddedId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  function addProjectRow() {
    const newId = crypto.randomUUID()
    setProjects((cur) => [...cur, { name: '', description: '', tags: [], links: [], _id: newId }])
    setPublicProjects((cur) => [...cur, { name: false, tags: false, description: false }])
    setLastAddedId(newId)
  }

  useEffect(() => {
    if (!lastAddedId) return
    document.getElementById(`project-row-${lastAddedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    ;(document.getElementById(`project-name-${lastAddedId}`) as HTMLInputElement | null)?.focus()
  }, [lastAddedId])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = projects.findIndex((p) => p._id === active.id)
    const newIdx = projects.findIndex((p) => p._id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    setProjects(() => arrayMove(projects, oldIdx, newIdx))
    setPublicProjects(() => arrayMove(publicProjects, oldIdx, newIdx))
  }
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <FolderKanban className="h-4 w-4 shrink-0" /> {t('projects')}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addProjectRow}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" /> {t('adminAdd')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={projects.map((p) => p._id)} strategy={verticalListSortingStrategy}>
        {projects.map((p, idx) => (
          <SortableRow key={p._id} id={p._id}>
          <div id={`project-row-${p._id}`} className="group flex items-start gap-1">
            <DragHandle className="mt-3" />
            <details
              open={!isMobile || p._id === lastAddedId}
              className="min-w-0 flex-1 rounded-xl border border-slate-200/60 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-950/20"
            >
            <summary className="cursor-pointer list-none text-xs font-semibold text-slate-700 dark:text-slate-300 md:hidden">
              <span className="mr-2 inline-block w-3 text-center transition-transform group-open:rotate-90">{'>'}</span>
              {t('adminProjectItem')} {idx + 1}: {(p.name || t('adminUntitled')).slice(0, 60)}
            </summary>
            <div className="mt-2 space-y-2 md:mt-0">
              <div className="flex justify-end">
                <ConfirmButton
                  label={t('adminRemoveProject')}
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40"
                  confirmTitle={t('adminRemoveProjectConfirmTitle')}
                  confirmDescription={t('adminRemoveItemAndVisibilityDescription')}
                  confirmLabel={t('adminRemove')}
                  onConfirm={() => {
                    setProjects((cur) => cur.filter((_, i) => i !== idx))
                    setPublicProjects((cur) => cur.filter((_, i) => i !== idx))
                  }}
                />
              </div>
              {rowErrors?.[idx] ? <div className="text-[11px] text-red-700 dark:text-red-300">{rowErrors[idx]}</div> : null}
              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('adminName')}
                  <input
                    id={`project-name-${p._id}`}
                    value={p.name}
                    onChange={(ev) => setProjects((cur) => cur.map((x, i) => (i === idx ? { ...x, name: ev.target.value } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder={t('adminName')}
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
                <div>
                  <ChipListEditor
                    items={p.tags ?? []}
                    onChange={(items) => setProjects((cur) => cur.map((x, i) => (i === idx ? { ...x, tags: items } : x)))}
                    placeholder={t('adminAddTag')}
                  />
                </div>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicProjects[idx]?.tags)}
                    onClick={() => setPublicProjects((cur) => cur.map((x, i) => (i === idx ? { ...x, tags: !x.tags } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('adminDescription')}
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
                    <Link2 className="h-3.5 w-3.5 shrink-0" /> {t('adminProjectLinksPrivateOnly')}
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
                    <Plus className="h-3.5 w-3.5 shrink-0" /> {t('adminAddLink')}
                  </button>
                </div>
                <div className="space-y-2">
                  {(p.links ?? []).map((link, linkIdx) => (
                    <div key={linkIdx} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200/60 p-2 dark:border-slate-800 md:grid-cols-[1fr_1fr_auto]">
                      {(() => {
                        const currentSelectValue = PROJECT_LINK_LABEL_OPTIONS.includes(link.label as (typeof PROJECT_LINK_LABEL_OPTIONS)[number])
                          ? link.label
                          : CUSTOM_OPTION
                        const options = [
                          { value: '', label: t('adminSelectLinkLabel') },
                          { value: 'demo', label: t('adminProjectLinkPresetDemo') },
                          { value: 'github', label: t('adminLinkPresetGithub'), icon: <SiGithubIcon className="h-3.5 w-3.5" /> },
                          { value: 'gitlab', label: t('adminLinkPresetGitlab'), icon: <SiGitlabIcon className="h-3.5 w-3.5" /> },
                          { value: 'docs', label: t('adminProjectLinkPresetDocs') },
                          { value: 'video', label: t('adminProjectLinkPresetVideo'), icon: <SiYoutubeIcon className="h-3.5 w-3.5" /> },
                          { value: 'case-study', label: t('adminProjectLinkPresetCaseStudy') },
                          { value: 'npm', label: t('adminProjectLinkPresetNpm'), icon: <SiNpmIcon className="h-3.5 w-3.5" /> },
                          { value: 'pypi', label: t('adminProjectLinkPresetPypi'), icon: <SiPypiIcon className="h-3.5 w-3.5" /> },
                          { value: 'app-store', label: t('adminProjectLinkPresetAppStore'), icon: <SiAppstoreIcon className="h-3.5 w-3.5" /> },
                          { value: 'play-store', label: t('adminProjectLinkPresetPlayStore'), icon: <SiGoogleplayIcon className="h-3.5 w-3.5" /> },
                          { value: CUSTOM_OPTION, label: t('adminCustom') },
                        ]
                        return (
                          <div className="space-y-2">
                            <IconSelect
                              value={currentSelectValue}
                              onChange={(next) =>
                                setProjects((cur) =>
                                  cur.map((x, i) => {
                                    if (i !== idx) return x
                                    return {
                                      ...x,
                                      links: (x.links ?? []).map((lx, li) => {
                                        if (li !== linkIdx) return lx
                                        if (next === CUSTOM_OPTION) {
                                          const keepCustom = PROJECT_LINK_LABEL_OPTIONS.includes(
                                            lx.label as (typeof PROJECT_LINK_LABEL_OPTIONS)[number],
                                          )
                                            ? ''
                                            : lx.label
                                          return { ...lx, label: keepCustom }
                                        }
                                        if (!next) return { ...lx, label: '' }
                                        return { ...lx, label: next }
                                      }),
                                    }
                                  }),
                                )
                              }
                              options={options}
                              placeholder={t('adminSelectLinkLabel')}
                              ariaLabel={t('adminProjectLinkLabel')}
                            />
                            {currentSelectValue === CUSTOM_OPTION ? (
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
                                placeholder={t('adminCustomLabel')}
                              />
                            ) : null}
                          </div>
                        )
                      })()}
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
                        label={t('adminRemove')}
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40"
                        confirmTitle={t('adminRemoveProjectLinkConfirmTitle')}
                        confirmDescription={t('adminRemoveNestedLinkConfirmDescription')}
                        confirmLabel={t('adminRemove')}
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
          </div>
          </SortableRow>
        ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={addProjectRow}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
        >
          <Plus className="h-3.5 w-3.5 shrink-0" /> {t('adminAdd')}
        </button>
      </div>
    </section>
  )
}

