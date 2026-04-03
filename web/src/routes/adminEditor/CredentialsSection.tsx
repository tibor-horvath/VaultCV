import { ToggleButton } from './ToggleButton'
import { ConfirmButton } from './ConfirmButton'
import { BadgeCheck, Plus, Trash2 } from 'lucide-react'
import type { CredentialRow } from './types'
import { IconSelect } from './IconSelect'
import { CredentialIssuerIcon } from '../../components/cv/CredentialIssuerIcon'
import { useI18n } from '../../lib/i18n'
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableRow } from './SortableRow'
import { DragHandle } from './DragHandle'

const ISSUER_OPTIONS = ['microsoft', 'aws', 'google', 'school', 'language', 'other'] as const
const CUSTOM_OPTION = '__custom__'

export function CredentialsSection(props: {
  credentials: CredentialRow[]
  setCredentials: (updater: (cur: CredentialRow[]) => CredentialRow[]) => void
  isMobile: boolean
  rowErrors?: string[]
}) {
  const { t } = useI18n()
  const { credentials, setCredentials, isMobile, rowErrors } = props

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = credentials.findIndex((c) => c._id === active.id)
    const newIdx = credentials.findIndex((c) => c._id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    setCredentials(() => arrayMove(credentials, oldIdx, newIdx))
  }
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <BadgeCheck className="h-4 w-4 shrink-0" /> {t('credentials')}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCredentials((cur) => [...cur, { issuer: '', label: '', url: '', isPublic: false, _id: crypto.randomUUID() }])
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" /> {t('adminAdd')}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={credentials.map((c) => c._id)} strategy={verticalListSortingStrategy}>
        {credentials.map((c, idx) => (
          <SortableRow key={c._id} id={c._id}>
          <div className="group flex items-start gap-1">
            <DragHandle className="mt-2.5" />
            <details open={!isMobile} className="min-w-0 flex-1 rounded-xl border border-slate-200/60 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-950/20">
            <summary className="cursor-pointer list-none text-xs font-semibold text-slate-700 dark:text-slate-300 md:hidden">
              <span className="mr-2 inline-block w-3 text-center transition-transform group-open:rotate-90">{'>'}</span>
              {t('adminCredentialItem')} {idx + 1}: {(c.label || c.issuer || t('adminUntitled')).slice(0, 60)}
            </summary>
            <div className="mt-2 space-y-2 md:mt-0">
              <div className="flex justify-end">
                <ConfirmButton
                  label={t('adminRemoveCredential')}
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40"
                  confirmTitle={t('adminRemoveCredentialConfirmTitle')}
                  confirmDescription={t('adminRemoveItemAndVisibilityDescription')}
                  confirmLabel={t('adminRemove')}
                  onConfirm={() => {
                    setCredentials((cur) => cur.filter((_, i) => i !== idx))
                  }}
                />
              </div>
              {rowErrors?.[idx] ? <div className="text-[11px] text-red-700 dark:text-red-300">{rowErrors[idx]}</div> : null}
              <div className="space-y-2 md:grid md:grid-cols-[1fr_1fr_auto] md:gap-3 md:space-y-0">
                <div className="grid items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t('adminIssuer')}
                    {(() => {
                      const currentSelectValue = ISSUER_OPTIONS.includes(c.issuer as (typeof ISSUER_OPTIONS)[number]) ? c.issuer : CUSTOM_OPTION
                      const options = [
                        { value: '', label: t('adminSelectIssuer') },
                        { value: 'microsoft', label: t('adminIssuerMicrosoft'), icon: <CredentialIssuerIcon issuer="microsoft" className="h-3.5 w-3.5" /> },
                        { value: 'aws', label: t('adminIssuerAws'), icon: <CredentialIssuerIcon issuer="aws" className="h-3.5 w-3.5" /> },
                        { value: 'google', label: t('adminIssuerGoogle'), icon: <CredentialIssuerIcon issuer="google" className="h-3.5 w-3.5" /> },
                        { value: 'school', label: t('adminIssuerSchool'), icon: <CredentialIssuerIcon issuer="school" className="h-3.5 w-3.5" /> },
                        { value: 'language', label: t('adminIssuerLanguage'), icon: <CredentialIssuerIcon issuer="language" className="h-3.5 w-3.5" /> },
                        { value: 'other', label: t('other'), icon: <CredentialIssuerIcon issuer="other" className="h-3.5 w-3.5" /> },
                        { value: CUSTOM_OPTION, label: t('adminCustom') },
                      ]
                      return (
                        <>
                          <IconSelect
                            value={currentSelectValue}
                            onChange={(next) =>
                              setCredentials((cur) =>
                                cur.map((x, i) => {
                                  if (i !== idx) return x
                                  if (next === CUSTOM_OPTION) {
                                    const keepCustom = ISSUER_OPTIONS.includes(x.issuer as (typeof ISSUER_OPTIONS)[number]) ? '' : x.issuer
                                    return { ...x, issuer: keepCustom }
                                  }
                                  if (!next) return { ...x, issuer: '' }
                                  return { ...x, issuer: next }
                                }),
                              )
                            }
                            options={options}
                            placeholder={t('adminSelectIssuer')}
                            ariaLabel={t('adminCredentialIssuer')}
                          />
                          {currentSelectValue === CUSTOM_OPTION ? (
                            <input
                              value={c.issuer}
                              onChange={(e) => setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, issuer: e.target.value } : x)))}
                              className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                              placeholder={t('adminCustomIssuer')}
                            />
                          ) : null}
                        </>
                      )
                    })()}
                  </label>
                </div>

                <div className="grid items-start gap-2">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t('adminLabel')}
                    <input
                      value={c.label}
                      onChange={(e) => setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="Microsoft Certified: ..."
                    />
                  </label>
                </div>

                <div className="flex items-start justify-end md:pt-5">
                  <ToggleButton
                    pressed={Boolean(c.isPublic)}
                    onClick={() => setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, isPublic: !x.isPublic } : x)))}
                  />
                </div>

                <div className="grid items-start gap-2 md:col-span-3">
                  <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t('adminUrl')}
                    <input
                      value={c.url}
                      onChange={(e) => setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))}
                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="https://..."
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('adminEarnedYearMonth')}
                  <input
                    value={c.dateEarned ?? ''}
                    onChange={(e) =>
                      setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, dateEarned: e.target.value || undefined } : x)))
                    }
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="2025-01"
                  />
                </label>

                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('adminExpiresYearMonth')}
                  <input
                    value={c.dateExpires ?? ''}
                    onChange={(e) =>
                      setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, dateExpires: e.target.value || undefined } : x)))
                    }
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="2028-01"
                  />
                </label>
              </div>
            </div>
            </details>
          </div>
          </SortableRow>
        ))}
          </SortableContext>
        </DndContext>
      </div>
    </section>
  )
}

