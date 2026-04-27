import { ToggleButton } from './ToggleButton'
import { ConfirmButton } from './ConfirmButton'
import { BriefcaseBusiness, Globe, Link2, Plus, Trash2 } from 'lucide-react'
import type { ExperienceRow, PublicExperienceFlags } from './types'
import { IconSelect } from './IconSelect'
import { SiGithubIcon, SiGitlabIcon, SiLinkedinIcon } from '../../components/icons/SimpleBrandIcons'
import { StringListEditor } from './StringListEditor'
import { useI18n } from '../../lib/i18n'
import { useEffect, useState } from 'react'
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableRow } from './SortableRow'
import { DragHandle } from './DragHandle'
import { ChipListEditor } from './ChipListEditor'

const EXPERIENCE_LINK_LABEL_OPTIONS = ['website', 'linkedin', 'github', 'gitlab'] as const
const CUSTOM_OPTION = '__custom__'

export function ExperienceSection(props: {
  experience: ExperienceRow[]
  setExperience: (updater: (cur: ExperienceRow[]) => ExperienceRow[]) => void
  publicExperience: PublicExperienceFlags[]
  setPublicExperience: (updater: (cur: PublicExperienceFlags[]) => PublicExperienceFlags[]) => void
  isMobile: boolean
  rowErrors?: string[]
}) {
  const { t } = useI18n()
  const { experience, setExperience, publicExperience, setPublicExperience, isMobile, rowErrors } = props

  const [lastAddedId, setLastAddedId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  function addExperienceRow() {
    const newId = crypto.randomUUID()
    setExperience((cur) => [
      ...cur,
      {
        company: '',
        role: '',
        start: '',
        end: '',
        links: [],
        skills: [],
        highlights: [],
        _id: newId,
      },
    ])
    setPublicExperience((cur) => [
      ...cur,
      {
        company: false,
        links: false,
        role: false,
        start: false,
        end: false,
        location: false,
        skills: false,
        highlights: false,
      },
    ])
    setLastAddedId(newId)
  }

  useEffect(() => {
    if (!lastAddedId) return
    document.getElementById(`experience-row-${lastAddedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    ;(document.getElementById(`experience-company-${lastAddedId}`) as HTMLInputElement | null)?.focus()
  }, [lastAddedId])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = experience.findIndex((e) => e._id === active.id)
    const newIdx = experience.findIndex((e) => e._id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    setExperience(() => arrayMove(experience, oldIdx, newIdx))
    setPublicExperience(() => arrayMove(publicExperience, oldIdx, newIdx))
  }
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <BriefcaseBusiness className="h-4 w-4 shrink-0" /> {t('experience')}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addExperienceRow}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" /> {t('adminAdd')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={experience.map((e) => e._id)} strategy={verticalListSortingStrategy}>
        {experience.map((e, idx) => (
          <SortableRow key={e._id} id={e._id}>
          <div id={`experience-row-${e._id}`} className="group flex items-start gap-1">
            <DragHandle className="mt-3" />
            <details
              open={!isMobile || e._id === lastAddedId}
              className="min-w-0 flex-1 rounded-xl border border-slate-200/60 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-950/20"
            >
            <summary className="cursor-pointer list-none text-xs font-semibold text-slate-700 dark:text-slate-300 md:hidden">
              <span className="mr-2 inline-block w-3 text-center transition-transform group-open:rotate-90">{'>'}</span>
              {t('adminExperienceItem')} {idx + 1}: {(e.company || e.role || t('adminUntitled')).slice(0, 60)}
            </summary>
            <div className="mt-2 space-y-2 md:mt-0">
              <div className="flex justify-end">
                <ConfirmButton
                  label={t('adminRemoveExperience')}
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40"
                  confirmTitle={t('adminRemoveExperienceConfirmTitle')}
                  confirmDescription={t('adminRemoveEntryConfirmDescription')}
                  confirmLabel={t('adminRemove')}
                  onConfirm={() => {
                    setExperience((cur) => cur.filter((_, i) => i !== idx))
                    setPublicExperience((cur) => cur.filter((_, i) => i !== idx))
                  }}
                />
              </div>
              {rowErrors?.[idx] ? <div className="text-[11px] text-red-700 dark:text-red-300">{rowErrors[idx]}</div> : null}
              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('adminCompany')}
                  <input
                    id={`experience-company-${e._id}`}
                    value={e.company}
                    onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, company: ev.target.value } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder={t('adminCompany')}
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicExperience[idx]?.company)}
                    onClick={() => setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, company: !x.company } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <div className="space-y-2 rounded-lg border border-slate-200/60 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Link2 className="h-3.5 w-3.5 shrink-0" /> {`${t('adminCompanyLinks')} (${t('adminOptional')})`}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExperience((cur) =>
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
                    {(e.links ?? []).map((link, linkIdx) => (
                      <div key={linkIdx} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200/60 p-2 dark:border-slate-800 md:grid-cols-[1fr_1fr_auto]">
                        {(() => {
                          const currentSelectValue = EXPERIENCE_LINK_LABEL_OPTIONS.includes(
                            link.label as (typeof EXPERIENCE_LINK_LABEL_OPTIONS)[number],
                          )
                            ? link.label
                            : CUSTOM_OPTION
                          const options = [
                            { value: '', label: t('adminSelectLinkLabel') },
                            { value: 'website', label: t('website'), icon: <Globe className="h-3.5 w-3.5" /> },
                            { value: 'linkedin', label: t('linkedIn'), icon: <SiLinkedinIcon className="h-3.5 w-3.5" /> },
                            { value: 'github', label: t('adminLinkPresetGithub'), icon: <SiGithubIcon className="h-3.5 w-3.5" /> },
                            { value: 'gitlab', label: t('adminLinkPresetGitlab'), icon: <SiGitlabIcon className="h-3.5 w-3.5" /> },
                            { value: CUSTOM_OPTION, label: t('adminCustom') },
                          ]
                          return (
                            <div className="space-y-2">
                              <IconSelect
                                value={currentSelectValue}
                                onChange={(next) =>
                                  setExperience((cur) =>
                                    cur.map((x, i) => {
                                      if (i !== idx) return x
                                      return {
                                        ...x,
                                        links: (x.links ?? []).map((lx, li) => {
                                          if (li !== linkIdx) return lx
                                          if (next === CUSTOM_OPTION) {
                                            const keepCustom = EXPERIENCE_LINK_LABEL_OPTIONS.includes(
                                              lx.label as (typeof EXPERIENCE_LINK_LABEL_OPTIONS)[number],
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
                                ariaLabel={t('adminExperienceLinkLabel')}
                              />
                              {currentSelectValue === CUSTOM_OPTION ? (
                                <input
                                  value={link.label}
                                  onChange={(ev) =>
                                    setExperience((cur) =>
                                      cur.map((x, i) =>
                                        i === idx
                                          ? {
                                              ...x,
                                              links: (x.links ?? []).map((lx, li) =>
                                                li === linkIdx ? { ...lx, label: ev.target.value } : lx,
                                              ),
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
                            setExperience((cur) =>
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
                          confirmTitle={t('adminRemoveCompanyLinkConfirmTitle')}
                          confirmDescription={t('adminRemoveNestedLinkConfirmDescription')}
                          confirmLabel={t('adminRemove')}
                          onConfirm={() =>
                            setExperience((cur) =>
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
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicExperience[idx]?.links)}
                    onClick={() => setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, links: !x.links } : x)))}
                  />
                </div>
              </div>

              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t('adminRole')}
                    <input
                      value={e.role}
                      onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, role: ev.target.value } : x)))}
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder={t('adminRole')}
                    />
                  </label>
                  <div className="pt-5">
                    <ToggleButton
                      pressed={Boolean(publicExperience[idx]?.role)}
                      onClick={() => setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, role: !x.role } : x)))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t('adminStart')}
                    <input
                      value={e.start}
                      onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, start: ev.target.value } : x)))}
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder={t('adminStart')}
                    />
                  </label>
                  <div className="pt-5">
                    <ToggleButton
                      pressed={Boolean(publicExperience[idx]?.start)}
                      onClick={() => setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, start: !x.start } : x)))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t('adminEnd')}
                    <input
                      value={e.end}
                      onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, end: ev.target.value } : x)))}
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder={t('adminEnd')}
                    />
                  </label>
                  <div className="pt-5">
                    <ToggleButton
                      pressed={Boolean(publicExperience[idx]?.end)}
                      onClick={() => setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, end: !x.end } : x)))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {`${t('location')} (${t('adminOptional')})`}
                    <input
                      value={e.location ?? ''}
                      onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, location: ev.target.value || undefined } : x)))}
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder={t('location')}
                    />
                  </label>
                  <div className="pt-5">
                    <ToggleButton
                      pressed={Boolean(publicExperience[idx]?.location)}
                      onClick={() => setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, location: !x.location } : x)))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <div>
                  <ChipListEditor
                    items={e.skills ?? []}
                    onChange={(items) =>
                      setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, skills: items } : x)))
                    }
                    placeholder={t('adminAddSkill')}
                  />
                </div>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicExperience[idx]?.skills)}
                    onClick={() => setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, skills: !x.skills } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <div>
                  <StringListEditor
                    label={t('adminHighlights')}
                    items={e.highlights ?? []}
                    setItems={(items) =>
                      setExperience((cur) =>
                        cur.map((x, i) => (i === idx ? { ...x, highlights: items } : x)),
                      )
                    }
                    placeholder={t('adminAddHighlight')}
                    multilineItems
                  />
                </div>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicExperience[idx]?.highlights)}
                    onClick={() =>
                      setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, highlights: !x.highlights } : x)))
                    }
                  />
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
          onClick={addExperienceRow}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
        >
          <Plus className="h-3.5 w-3.5 shrink-0" /> {t('adminAdd')}
        </button>
      </div>
    </section>
  )
}

