import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DragHandleContext } from './DragHandle'

/**
 * Generic sortable row wrapper.
 * Wrap each draggable list item in this component inside a DndContext +
 * SortableContext. Place a <DragHandle /> anywhere inside children — it will
 * automatically receive the @dnd-kit listeners/attributes via context.
 */
export function SortableRow({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <DragHandleContext.Provider value={{ listeners, attributes }}>
      <div
        ref={setNodeRef}
        style={style}
        className={[
          'group relative',
          isDragging ? 'opacity-60 shadow-lg' : '',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </DragHandleContext.Provider>
  )
}
