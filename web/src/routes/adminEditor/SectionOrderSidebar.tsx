import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Lock } from 'lucide-react'
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

function SortableSidebarItem({ sectionKey, label }: { sectionKey: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sectionKey })
  const { t } = useI18n()
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        'group flex items-center gap-1.5 rounded-field px-2 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-muted',
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
        className="cursor-grab text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() =>
          document.querySelector<HTMLElement>(`[data-section="${sectionKey}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        className="flex-1 rounded-md px-1 py-0.5 text-left transition-colors hover:text-ink"
      >
        {label}
      </button>
    </div>
  )
}

export function SectionOrderSidebar({
  sectionOrder,
  setSectionOrder,
}: {
  sectionOrder: SectionKey[]
  setSectionOrder: (order: SectionKey[]) => void
}) {
  const { t } = useI18n()

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
    <div className="fixed left-3 top-24 z-30 hidden w-52 flex-col rounded-card border border-line bg-surface px-2.5 py-3.5 shadow-raised lg:flex">
      <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
        {t('adminSectionOrder')}
      </div>
      {/* Basics — locked at top */}
      <div className="mb-1 flex items-center gap-1.5 rounded-field border border-line bg-surface px-2 py-1.5 text-xs font-medium text-ink-subtle">
        <Lock className="h-3 w-3 shrink-0" />
        <span>{t('adminBasics')}</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          {sectionOrder.map((key) => (
            <SortableSidebarItem key={key} sectionKey={key} label={t(SECTION_LABEL_KEYS[key])} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}
