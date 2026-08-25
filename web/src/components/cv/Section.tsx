import { Card, CardHeader } from '../ui/Card'

/** One CV block (Experience, Skills, ...). Every section on the page shares this shape. */
export function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card as="section">
      <CardHeader title={title} icon={icon} />
      <div className="mt-4">{children}</div>
    </Card>
  )
}
