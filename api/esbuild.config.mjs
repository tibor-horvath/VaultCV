import { build } from 'esbuild'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

// Discover all function entry points (folders containing function.json)
const apiDir = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const entries = readdirSync(apiDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(apiDir, d.name, 'function.json')))
  .map(d => d.name)

const entryPoints = Object.fromEntries(
  entries.map(name => [name + '/index', join(apiDir, name, 'index.ts')])
)

await build({
  entryPoints,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outdir: join(apiDir, 'dist'),
  outExtension: { '.js': '.js' },
  sourcemap: false,
  minify: false,
})

console.log(`Bundled ${entries.length} functions: ${entries.join(', ')}`)
