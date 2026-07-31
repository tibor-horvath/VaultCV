import { Circle, Path, Rect, Svg } from '@react-pdf/renderer'
import { pdfIcons, type PdfIconName, type PdfIconNode } from './pdfIcons'

/** Lucide's own defaults (`lucide-react/dist/esm/defaultAttributes.js`). */
const STROKE_ATTRS = {
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

function shape(node: PdfIconNode, key: number, props: Record<string, unknown>) {
  if (node.tag === 'path') return <Path key={key} d={node.d} {...props} />
  if (node.tag === 'circle') return <Circle key={key} cx={node.cx} cy={node.cy} r={node.r} {...props} />
  return <Rect key={key} x={node.x} y={node.y} width={node.width} height={node.height} rx={node.rx} {...props} />
}

/**
 * react-pdf has no `currentColor`, so every icon takes an explicit color.
 *
 * Stroke width is scaled up at very small sizes: these icons render at ~7-9pt, where lucide's
 * default 2/24 stroke lands below a printer hairline and washes out.
 */
export function PdfIcon({
  name,
  size,
  color,
  strokeWidth,
}: {
  name: PdfIconName
  size: number
  color: string
  strokeWidth?: number
}) {
  const def = pdfIcons[name]
  const stroke = strokeWidth ?? (size < 8 ? 2.5 : 2)

  return (
    <Svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
      {def.kind === 'fill' ? (
        <Path d={def.d} fill={color} />
      ) : def.kind === 'fillNodes' ? (
        def.nodes.map((node, i) => shape(node, i, { fill: color, fillOpacity: node.opacity ?? 1 }))
      ) : (
        def.nodes.map((node, i) => shape(node, i, { ...STROKE_ATTRS, stroke: color, strokeWidth: stroke }))
      )}
    </Svg>
  )
}
