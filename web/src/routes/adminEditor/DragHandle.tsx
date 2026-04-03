import { createContext, useContext } from 'react'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { GripVertical } from 'lucide-react'

// Context that SortableRow populates so DragHandle can access listeners/attributes
// without prop-drilling through arbitrary component trees.
export const DragHandleContext = createContext<{
  listeners: SyntheticListenerMap | undefined
  attributes: DraggableAttributes
} | null>(null)

export function DragHandle({ label = 'Drag to reorder', className }: { label?: string; className?: string }) {
  const ctx = useContext(DragHandleContext)
  return (
    <button
      type="button"
      aria-label={label}
      // spread listeners/attributes for @dnd-kit drag activation
      {...ctx?.attributes}
      {...ctx?.listeners}
      className={[
        'flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-slate-400 opacity-0 transition-opacity hover:text-slate-600 focus:opacity-100 focus:outline-none group-hover:opacity-100 active:cursor-grabbing dark:text-slate-500 dark:hover:text-slate-300',
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
