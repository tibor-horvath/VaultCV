import { useEffect, useRef } from 'react'
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Lock, X } from 'lucide-react'
import { useI18n } from '../../lib/i18n'
import type { SectionKey } from '../../lib/sectionOrder'
import type { MessageKey } from '../../i18n/messages/en'

const SECTION_LABEL_KEYS: Record<SectionKey, MessageKey> = {
  credentials: 'credentials',
  skillsLanguages: 'adminSkillsAndLanguages',
  links: 'adminLinksSection',
  experience: 'experience',
  projects: 'projects',
  education: 'education',
}

function SortableSheetItem({ sectionKey, label }: { sectionKey: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sectionKey })
  const { t } = useI18n()
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        'group flex items-center gap-3 rounded-xl border border-slate-100/80 bg-white/70 px-3 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200',
        isDragging ? 'opacity-50 shadow-md' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        aria-label={t('adminDragToReorder')}
        {...attributes}
        {...listeners}
        className="cursor-grab text-slate-300 active:cursor-grabbing dark:text-slate-600"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="flex-1">{label}</span>
    </div>
  )
}

export function SectionOrderSheet({
  isOpen,
  onClose,
  sectionOrder,
  setSectionOrder,
}: {
  isOpen: boolean
  onClose: () => void
  sectionOrder: SectionKey[]
  setSectionOrder: (order: SectionKey[]) => void
}) {
  const { t } = useI18n()
  const sheetRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = sectionOrder.indexOf(active.id as SectionKey)
    const newIdx = sectionOrder.indexOf(over.id as SectionKey)
    if (oldIdx === -1 || newIdx === -1) return
    setSectionOrder(arrayMove(sectionOrder, oldIdx, newIdx))
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ]
          .filter(Boolean)
          .join(' ')}
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('adminSectionOrder')}
        className={[
          'fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-slate-200/70 bg-gradient-to-b from-white to-slate-50/90 px-4 pb-safe-area-bottom pt-3 shadow-2xl backdrop-blur transition-transform duration-300 lg:hidden dark:border-slate-800 dark:from-slate-950 dark:to-slate-900/95',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="mb-3 flex justify-center">
          <span className="h-1 w-12 rounded-full bg-slate-300/80 dark:bg-slate-700/80" aria-hidden="true" />
        </div>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">{t('adminSectionOrder')}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('adminQrClose')}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Locked Basics row */}
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-3 text-sm font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-600">
          <Lock className="h-5 w-5 shrink-0" />
          <span>{t('adminBasicsPinned')}</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 pb-6">
              {sectionOrder.map((key) => (
                <SortableSheetItem key={key} sectionKey={key} label={t(SECTION_LABEL_KEYS[key])} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </>
  )
}
