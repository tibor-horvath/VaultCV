import { ToggleButton } from './ToggleButton'
import { ConfirmButton } from './ConfirmButton'
import { GraduationCap, Plus, Trash2 } from 'lucide-react'
import type { EducationRow, PublicEducationFlags } from './types'
import { StringListEditor } from './StringListEditor'
import { useI18n } from '../../lib/i18n'
import { useEffect, useState } from 'react'
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableRow } from './SortableRow'
import { DragHandle } from './DragHandle'

export function EducationSection(props: {
  education: EducationRow[]
  setEducation: (updater: (cur: EducationRow[]) => EducationRow[]) => void
  publicEducation: PublicEducationFlags[]
  setPublicEducation: (updater: (cur: PublicEducationFlags[]) => PublicEducationFlags[]) => void
  isMobile: boolean
  rowErrors?: string[]
}) {
  const { t } = useI18n()
  const { education, setEducation, publicEducation, setPublicEducation, isMobile, rowErrors } = props

  const [lastAddedId, setLastAddedId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  function addEducationRow() {
    const newId = crypto.randomUUID()
    setEducation((cur) => [...cur, { school: '', program: '', highlights: [], _id: newId }])
    setPublicEducation((cur) => [
      ...cur,
      {
        school: false,
        schoolUrl: false,
        degree: false,
        field: false,
        program: false,
        start: false,
        end: false,
        location: false,
        highlights: false,
      },
    ])
    setLastAddedId(newId)
  }

  useEffect(() => {
    if (!lastAddedId) return
    document.getElementById(`education-row-${lastAddedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    ;(document.getElementById(`education-school-${lastAddedId}`) as HTMLInputElement | null)?.focus()
  }, [lastAddedId])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = education.findIndex((e) => e._id === active.id)
    const newIdx = education.findIndex((e) => e._id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    setEducation(() => arrayMove(education, oldIdx, newIdx))
    setPublicEducation(() => arrayMove(publicEducation, oldIdx, newIdx))
  }
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <GraduationCap className="h-4 w-4 shrink-0" /> {t('education')}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addEducationRow}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" /> {t('adminAdd')}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={education.map((e) => e._id)} strategy={verticalListSortingStrategy}>
        {education.map((e, idx) => (
          <SortableRow key={e._id} id={e._id}>
          <div id={`education-row-${e._id}`} className="group flex items-start gap-1">
            <DragHandle className="mt-2.5" />
            <details
              open={!isMobile || e._id === lastAddedId}
              className="min-w-0 flex-1 rounded-xl border border-slate-200/60 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-950/20"
            >
            <summary className="cursor-pointer list-none text-xs font-semibold text-slate-700 dark:text-slate-300 md:hidden">
              <span className="mr-2 inline-block w-3 text-center transition-transform group-open:rotate-90">{'>'}</span>
              {t('adminEducationItem')} {idx + 1}: {(e.school || e.program || t('adminUntitled')).slice(0, 60)}
            </summary>
            <div className="mt-2 space-y-2 md:mt-0">
              <div className="flex justify-end">
                <ConfirmButton
                  label={t('adminRemoveEducation')}
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40"
                  confirmTitle={t('adminRemoveEducationConfirmTitle')}
                  confirmDescription={t('adminRemoveEntryConfirmDescription')}
                  confirmLabel={t('adminRemove')}
                  onConfirm={() => {
                    setEducation((cur) => cur.filter((_, i) => i !== idx))
                    setPublicEducation((cur) => cur.filter((_, i) => i !== idx))
                  }}
                />
              </div>
              {rowErrors?.[idx] ? <div className="text-[11px] text-red-700 dark:text-red-300">{rowErrors[idx]}</div> : null}
              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t('adminSchool')}
                    <input
                      id={`education-school-${e._id}`}
                      value={e.school}
                      onChange={(ev) => setEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, school: ev.target.value } : x)))}
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder={t('adminSchool')}
                    />
                  </label>
                  <div className="pt-5">
                    <ToggleButton
                      pressed={Boolean(publicEducation[idx]?.school)}
                      onClick={() => setPublicEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, school: !x.school } : x)))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {`${t('adminSchoolUrl')} (${t('adminOptional')})`}
                    <input
                      value={e.schoolUrl ?? ''}
                      onChange={(ev) =>
                        setEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, schoolUrl: ev.target.value || undefined } : x)))
                      }
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="https://school.example"
                    />
                  </label>
                  <div className="pt-5">
                    <ToggleButton
                      pressed={Boolean(publicEducation[idx]?.schoolUrl)}
                      onClick={() => setPublicEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, schoolUrl: !x.schoolUrl } : x)))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {`${t('adminDegree')} (${t('adminOptional')})`}
                    <input
                      value={e.degree ?? ''}
                      onChange={(ev) =>
                        setEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, degree: ev.target.value || undefined } : x)))
                      }
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder={t('adminDegreePlaceholder')}
                    />
                  </label>
                  <div className="pt-5">
                    <ToggleButton
                      pressed={Boolean(publicEducation[idx]?.degree)}
                      onClick={() => setPublicEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, degree: !x.degree } : x)))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {`${t('focus')} (${t('adminOptional')})`}
                    <input
                      value={e.field ?? ''}
                      onChange={(ev) =>
                        setEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, field: ev.target.value || undefined } : x)))
                      }
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder={t('adminFieldPlaceholder')}
                    />
                  </label>
                  <div className="pt-5">
                    <ToggleButton
                      pressed={Boolean(publicEducation[idx]?.field)}
                      onClick={() => setPublicEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, field: !x.field } : x)))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {`${t('adminProgram')} (${t('adminOptional')})`}
                    <input
                      value={e.program ?? ''}
                      onChange={(ev) =>
                        setEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, program: ev.target.value || undefined } : x)))
                      }
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder={t('adminProgram')}
                    />
                  </label>
                  <div className="pt-5">
                    <ToggleButton
                      pressed={Boolean(publicEducation[idx]?.program)}
                      onClick={() => setPublicEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, program: !x.program } : x)))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {`${t('location')} (${t('adminOptional')})`}
                    <input
                      value={e.location ?? ''}
                      onChange={(ev) =>
                        setEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, location: ev.target.value || undefined } : x)))
                      }
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder={t('adminLocationPlaceholder')}
                    />
                  </label>
                  <div className="pt-5">
                    <ToggleButton
                      pressed={Boolean(publicEducation[idx]?.location)}
                      onClick={() => setPublicEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, location: !x.location } : x)))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {`${t('adminStart')} (${t('adminOptional')})`}
                    <input
                      value={e.start ?? ''}
                      onChange={(ev) =>
                        setEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, start: ev.target.value || undefined } : x)))
                      }
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="2020-09"
                    />
                  </label>
                  <div className="pt-5">
                    <ToggleButton
                      pressed={Boolean(publicEducation[idx]?.start)}
                      onClick={() => setPublicEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, start: !x.start } : x)))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {`${t('adminEnd')} (${t('adminOptional')})`}
                    <input
                      value={e.end ?? ''}
                      onChange={(ev) =>
                        setEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, end: ev.target.value || undefined } : x)))
                      }
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="2024-06"
                    />
                  </label>
                  <div className="pt-5">
                    <ToggleButton
                      pressed={Boolean(publicEducation[idx]?.end)}
                      onClick={() => setPublicEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, end: !x.end } : x)))}
                    />
                  </div>
                </div>

                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {`${t('adminGpa')} (${t('adminOptional')})`}
                  <input
                    value={e.gpa ?? ''}
                    onChange={(ev) => setEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, gpa: ev.target.value || undefined } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="3.9/4.0"
                  />
                </label>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <div>
                  <StringListEditor
                    label={t('adminHighlights')}
                    items={e.highlights ?? []}
                    setItems={(items) =>
                      setEducation((cur) =>
                        cur.map((x, i) => (i === idx ? { ...x, highlights: items } : x)),
                      )
                    }
                    placeholder={t('adminAddHighlight')}
                    multilineItems
                  />
                </div>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicEducation[idx]?.highlights)}
                    onClick={() => setPublicEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, highlights: !x.highlights } : x)))}
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
          onClick={addEducationRow}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
        >
          <Plus className="h-3.5 w-3.5 shrink-0" /> {t('adminAdd')}
        </button>
      </div>
    </section>
  )
}

