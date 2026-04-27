import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AtSign, Globe, Link2, Plus, Trash2 } from 'lucide-react'
import { SiGithubIcon, SiLinkedinIcon, SiMastodonIcon, SiXIcon, SiYoutubeIcon } from '../../components/icons/SimpleBrandIcons'
import { useI18n } from '../../lib/i18n'
import { ConfirmButton } from './ConfirmButton'
import { DragHandle } from './DragHandle'
import { IconSelect } from './IconSelect'
import { SortableRow } from './SortableRow'
import { ToggleButton } from './ToggleButton'
import type { LinkRow } from './types'

const LINK_LABEL_OPTIONS = ['GitHub', 'LinkedIn', 'Portfolio', 'Website', 'Blog', 'Twitter/X', 'Mastodon', 'YouTube', 'Email'] as const
const CUSTOM_OPTION = '__custom__'

export function LinksSection(props: {
  links: LinkRow[]
  setLinks: (updater: (cur: LinkRow[]) => LinkRow[]) => void
  isMobile: boolean
  rowErrors?: string[]
  embedded?: boolean
}) {
  const { t } = useI18n()
  const { links, setLinks, isMobile, rowErrors, embedded = false } = props

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  function addLinkRow() {
    setLinks((cur) => [...cur, { label: '', url: '', isPublic: false, _id: crypto.randomUUID() }])
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = links.findIndex((l) => l._id === active.id)
    const newIdx = links.findIndex((l) => l._id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    setLinks(() => arrayMove(links, oldIdx, newIdx))
  }

  return (
    <section
      className={
        embedded
          ? 'space-y-4 rounded-xl border border-slate-200/70 bg-white/40 p-4 dark:border-slate-800 dark:bg-slate-950/20'
          : 'space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30'
      }
    >
      <div
        className={
          embedded
            ? 'flex items-center justify-between'
            : 'sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0'
        }
      >
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Link2 className="h-4 w-4 shrink-0" /> {t('adminLinksSection')}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
            onClick={addLinkRow}
          >
            <Plus className="h-3.5 w-3.5 shrink-0" /> {t('adminAdd')}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={links.map((l) => l._id)} strategy={verticalListSortingStrategy}>
            {links.map((l, idx) => (
              <SortableRow key={l._id} id={l._id}>
                <div className="group flex items-start gap-1">
                  <DragHandle className="mt-2.5" />
                  <details open={!isMobile} className="min-w-0 flex-1 rounded-xl border border-slate-200/60 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-950/20">
                    <summary className="cursor-pointer list-none text-xs font-semibold text-slate-700 dark:text-slate-300 md:hidden">
                      <span className="mr-2 inline-block w-3 text-center transition-transform group-open:rotate-90">{'>'}</span>
                      {t('adminLinkItem')} {idx + 1}: {(l.label || l.url || t('adminUntitled')).slice(0, 60)}
                    </summary>
                    <div className="mt-2 space-y-2 md:mt-0">
                      {rowErrors?.[idx] ? <div className="text-[11px] text-red-700 dark:text-red-300">{rowErrors[idx]}</div> : null}
                      <div className="space-y-2 md:grid md:grid-cols-[1fr_1fr_auto_auto] md:gap-3 md:space-y-0">
                        <div className="grid items-start gap-2">
                          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                            {t('adminLabel')}
                            {(() => {
                              const currentSelectValue = LINK_LABEL_OPTIONS.includes(
                                l.label as (typeof LINK_LABEL_OPTIONS)[number],
                              )
                                ? l.label
                                : CUSTOM_OPTION
                              const options = [
                                { value: '', label: t('adminSelectLinkLabel') },
                                { value: 'GitHub', label: t('adminLinkPresetGithub'), icon: <SiGithubIcon className="h-3.5 w-3.5" /> },
                                { value: 'LinkedIn', label: t('adminLinkPresetLinkedIn'), icon: <SiLinkedinIcon className="h-3.5 w-3.5" /> },
                                { value: 'Portfolio', label: t('adminLinkPresetPortfolio'), icon: <Globe className="h-3.5 w-3.5" /> },
                                { value: 'Website', label: t('adminLinkPresetWebsite'), icon: <Globe className="h-3.5 w-3.5" /> },
                                { value: 'Blog', label: t('adminLinkPresetBlog'), icon: <Globe className="h-3.5 w-3.5" /> },
                                { value: 'Twitter/X', label: t('adminLinkPresetTwitterX'), icon: <SiXIcon className="h-3.5 w-3.5" /> },
                                { value: 'Mastodon', label: t('adminLinkPresetMastodon'), icon: <SiMastodonIcon className="h-3.5 w-3.5" /> },
                                { value: 'YouTube', label: t('adminLinkPresetYoutube'), icon: <SiYoutubeIcon className="h-3.5 w-3.5" /> },
                                { value: 'Email', label: t('adminLinkPresetEmail'), icon: <AtSign className="h-3.5 w-3.5" /> },
                                { value: CUSTOM_OPTION, label: t('adminCustom') },
                              ]
                              return (
                                <>
                                  <IconSelect
                                    value={currentSelectValue}
                                    onChange={(next) =>
                                      setLinks((cur) =>
                                        cur.map((x, i) => {
                                          if (i !== idx) return x
                                          if (next === CUSTOM_OPTION) {
                                            const keepCustom = LINK_LABEL_OPTIONS.includes(
                                              x.label as (typeof LINK_LABEL_OPTIONS)[number],
                                            )
                                              ? ''
                                              : x.label
                                            return { ...x, label: keepCustom }
                                          }
                                          if (!next) return { ...x, label: '' }
                                          return { ...x, label: next }
                                        }),
                                      )
                                    }
                                    options={options}
                                    placeholder={t('adminSelectLinkLabel')}
                                    ariaLabel={t('adminLinkLabel')}
                                  />
                                  {currentSelectValue === CUSTOM_OPTION ? (
                                    <input
                                      value={l.label}
                                      onChange={(e) =>
                                        setLinks((cur) => cur.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                                      }
                                      className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                      placeholder={t('adminCustomLabel')}
                                    />
                                  ) : null}
                                </>
                              )
                            })()}
                          </label>
                        </div>

                        <div className="grid items-start gap-2">
                          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                            {t('adminUrl')}
                            <input
                              value={l.url}
                              onChange={(e) => setLinks((cur) => cur.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))}
                              className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                              placeholder="https://..."
                            />
                          </label>
                        </div>

                        <div className="flex items-start justify-end md:pt-5">
                          <ToggleButton
                            pressed={Boolean(l.isPublic)}
                            onClick={() => setLinks((cur) => cur.map((x, i) => (i === idx ? { ...x, isPublic: !x.isPublic } : x)))}
                          />
                        </div>

                        <div className="flex items-start justify-end md:pt-5">
                          <ConfirmButton
                            label={t('adminRemoveLink')}
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40"
                            confirmTitle={t('adminRemoveLinkConfirmTitle')}
                            confirmDescription={t('adminRemoveLinkConfirmDescription')}
                            confirmLabel={t('adminRemove')}
                            onConfirm={() => {
                              setLinks((cur) => cur.filter((_, i) => i !== idx))
                            }}
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
    </section>
  )
}

