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
  experience: 'experience',
  projects: 'projects',
  education: 'education',
  hobbiesInterests: 'adminHobbiesAndInterests',
  honorsAwards: 'adminHonorsAndAwards',
}

function SortableSheetItem({ sectionKey, label }: { sectionKey: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sectionKey })
  const { t } = useI18n()
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        'group flex items-center gap-3 rounded-field border border-line bg-surface px-3 py-3 text-sm font-medium text-ink-muted',
        isDragging ? 'opacity-50 shadow-raised' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        aria-label={t('adminDragToReorder')}
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab text-ink-subtle active:cursor-grabbing"
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
          'fixed inset-0 z-40 bg-ink/40 transition-opacity duration-300 lg:hidden',
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
          'fixed inset-x-0 bottom-0 z-50 rounded-t-card border-t border-line bg-surface px-4 pb-safe-area-bottom pt-3 shadow-overlay transition-transform duration-300 lg:hidden',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="mb-3 flex justify-center">
          <span className="h-1 w-12 rounded-full bg-line-strong" aria-hidden="true" />
        </div>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-ink">{t('adminSectionOrder')}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('adminQrClose')}
            className="rounded-field p-1.5 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Locked Basics row */}
        <div className="mb-2 flex items-center gap-3 rounded-field border border-line bg-surface px-3 py-3 text-sm font-medium text-ink-subtle">
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
