import { describe, expect, it } from 'vitest'
import { pdfIcons, type PdfIconName } from './pdfIcons'

const names = Object.keys(pdfIcons) as PdfIconName[]

describe('pdfIcons', () => {
  it('has entries', () => {
    expect(names.length).toBeGreaterThan(0)
  })

  it.each(names)('%s is a well-formed icon definition', (name) => {
    const def = pdfIcons[name]

    if (def.kind === 'fill') {
      // Guards against a simple-icons upgrade renaming or dropping an export.
      expect(typeof def.d).toBe('string')
      expect(def.d.length).toBeGreaterThan(0)
      return
    }

    expect(def.nodes.length).toBeGreaterThan(0)
    for (const node of def.nodes) {
      expect(['path', 'circle', 'rect']).toContain(node.tag)
      if (node.tag === 'path') expect(node.d.length).toBeGreaterThan(0)
      if (node.tag === 'circle') expect(Number.isNaN(Number(node.r))).toBe(false)
      if (node.tag === 'rect') {
        expect(Number.isNaN(Number(node.width))).toBe(false)
        expect(Number.isNaN(Number(node.height))).toBe(false)
      }
    }
  })
})
