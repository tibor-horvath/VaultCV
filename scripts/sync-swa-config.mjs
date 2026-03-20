import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

const source = path.join(root, 'staticwebapp.config.json')
const targets = [
  path.join(root, 'web', 'staticwebapp.config.json'),
  path.join(root, 'web', 'public', 'staticwebapp.config.json'),
]

async function run() {
  const sourceContent = await fs.readFile(source, 'utf8')
  await Promise.all(
    targets.map(async (target) => {
      let current = ''
      try {
        current = await fs.readFile(target, 'utf8')
      } catch {
        // missing target file is fine; we create it
      }

      if (current === sourceContent) return
      await fs.writeFile(target, sourceContent, 'utf8')
    }),
  )
}

run().catch((err) => {
  console.error('Failed to sync staticwebapp config:', err)
  process.exitCode = 1
})
