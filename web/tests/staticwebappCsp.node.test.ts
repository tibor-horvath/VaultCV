// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The PDF renderer's layout engine (`yoga-layout` v3, pulled in by `@react-pdf/renderer`)
 * instantiates a WebAssembly module at render time. Under a strict `script-src` the browser
 * refuses to compile it, emscripten aborts inside an async callback, and `pdf().toBlob()` never
 * settles — the Download PDF button sits on "Generating…" forever with no error. Nothing in the
 * dev server reproduces this, because Vite serves no CSP.
 *
 * `'wasm-unsafe-eval'` is the narrow keyword for exactly this: it permits WebAssembly compilation
 * without opening up `eval()` the way `'unsafe-eval'` would.
 */
function readConfig(relativePath: string) {
  const path = fileURLToPath(new URL(relativePath, import.meta.url))
  return JSON.parse(readFileSync(path, 'utf8')) as {
    globalHeaders?: Record<string, string>
  }
}

const CONFIG_COPIES = [
  '../../staticwebapp.config.json',
  '../staticwebapp.config.json',
  '../public/staticwebapp.config.json',
]

describe('staticwebapp CSP', () => {
  it('allows WebAssembly so PDF generation can complete', () => {
    const csp = readConfig(CONFIG_COPIES[0]!).globalHeaders?.['Content-Security-Policy'] ?? ''
    const scriptSrc = csp
      .split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith('script-src'))

    expect(scriptSrc).toBeDefined()
    expect(scriptSrc?.split(/\s+/)).toContain("'wasm-unsafe-eval'")
    // The broad escape hatch must not creep in as a "fix" for the same symptom.
    expect(scriptSrc?.split(/\s+/)).not.toContain("'unsafe-eval'")
  })

  it('keeps the build-time copies byte-identical to the source of truth', () => {
    const [source, ...copies] = CONFIG_COPIES.map((p) =>
      readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8'),
    )
    for (const copy of copies) expect(copy).toBe(source)
  })
})
