import { Chip } from '../ui/Badge'

export function SkillsChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <Chip key={s} className="px-2.5 py-1.5">
          {s}
        </Chip>
      ))}
    </div>
  )
}
