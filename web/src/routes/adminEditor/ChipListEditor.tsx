import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X } from 'lucide-react'

function SortableChip({
  id,
  label,
  onRemove,
}: {
  id: string
  label: string
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/90 pl-3 pr-1.5 py-1 text-[11px] font-medium text-slate-700',
        'dark:border-slate-600/55 dark:bg-slate-800/55 dark:text-slate-200',
        isDragging ? 'opacity-60 shadow-md' : '',
        'cursor-grab active:cursor-grabbing select-none',
      ]
        .filter(Boolean)
        .join(' ')}
      {...attributes}
      {...listeners}
    >
      <span>{label}</span>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200/80 hover:text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:text-slate-500 dark:hover:bg-slate-700/60 dark:hover:text-slate-200"
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  )
}

/**
 * A draggable, removable chip list editor.
 * Used for global skills/languages and per-item tags/skills fields.
 */
export function ChipListEditor({
  items,
  onChange,
  placeholder = 'Add item…',
  inputId,
  error,
  errorId,
}: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  inputId?: string
  error?: string
  errorId?: string
}) {
  const [inputValue, setInputValue] = useState('')

  // Stable IDs: maintained in a ref, synced when items length changes from outside.
  const idsRef = useRef<string[]>(items.map(() => crypto.randomUUID()))
  const prevLenRef = useRef(items.length)
  if (prevLenRef.current !== items.length) {
    // Extend or truncate — preserve existing IDs where possible
    while (idsRef.current.length < items.length) {
      idsRef.current.push(crypto.randomUUID())
    }
    idsRef.current = idsRef.current.slice(0, items.length)
    prevLenRef.current = items.length
  }
  const ids = idsRef.current.slice()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = ids.indexOf(active.id as string)
    const newIdx = ids.indexOf(over.id as string)
    if (oldIdx === -1 || newIdx === -1) return
    idsRef.current = arrayMove(idsRef.current, oldIdx, newIdx)
    prevLenRef.current = idsRef.current.length
    onChange(arrayMove(items, oldIdx, newIdx))
  }

  function handleAdd() {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    idsRef.current = [...idsRef.current, crypto.randomUUID()]
    prevLenRef.current = idsRef.current.length
    onChange([...items, trimmed])
    setInputValue('')
  }

  function handleRemove(idx: number) {
    idsRef.current = idsRef.current.filter((_, i) => i !== idx)
    prevLenRef.current = idsRef.current.length
    onChange(items.filter((_, i) => i !== idx))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
            {items.map((item, idx) => (
              <SortableChip
                key={ids[idx]}
                id={ids[idx]}
                label={item}
                onRemove={() => handleRemove(idx)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-describedby={errorId}
          className="min-w-0 flex-1 rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="rounded-lg border border-slate-300/70 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
        >
          Add
        </button>
      </div>
      {error ? (
        <div id={errorId} role="alert" className="text-[11px] text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}
    </div>
  )
}
