import { createContext, useContext } from 'react'
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import { useI18n } from '../../lib/i18n'

// Context that SortableRow populates so DragHandle can access listeners/attributes
// without prop-drilling through arbitrary component trees.
export const DragHandleContext = createContext<{
  listeners: DraggableSyntheticListeners | undefined
  attributes: DraggableAttributes
} | null>(null)

export function DragHandle({ label, className }: { label?: string; className?: string }) {
  const { t } = useI18n()
  const ctx = useContext(DragHandleContext)
  const ariaLabel = label ?? t('adminDragToReorder')
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      // spread listeners/attributes for @dnd-kit drag activation
      {...ctx?.attributes}
      {...ctx?.listeners}
      className={[
        'flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-slate-400 opacity-0 touch-none transition-opacity hover:text-slate-600 focus:opacity-100 focus:outline-none group-hover:opacity-100 active:cursor-grabbing dark:text-slate-500 dark:hover:text-slate-300',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      tabIndex={0}
    >
      <GripVertical className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
