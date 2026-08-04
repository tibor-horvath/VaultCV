// One-command local setup: checks Node, installs workspace deps, and creates
// the gitignored local config files from their committed templates.
// Safe to re-run — existing local config files are never overwritten.
//
//   npm run setup
//
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const MIN_NODE = [20, 19]

function fail(message) {
  console.error(`\n  ✖ ${message}\n`)
  process.exit(1)
}

function checkNode() {
  const [major, minor] = process.versions.node.split('.').map(Number)
  if (major < MIN_NODE[0] || (major === MIN_NODE[0] && minor < MIN_NODE[1])) {
    fail(
      `Node.js ${MIN_NODE.join('.')}+ is required (found v${process.versions.node}).\n` +
        `    Install Node.js 22 from https://nodejs.org/ and re-run.`,
    )
  }
  console.log(`  ✔ Node.js v${process.versions.node}`)
}

function install(workspace) {
  const dir = path.join(root, workspace)
  console.log(`\n  → npm ci in ${workspace}/`)
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const res = spawnSync(npm, ['ci'], { cwd: dir, stdio: 'inherit' })
  if (res.status !== 0) fail(`npm ci failed in ${workspace}/`)
}

// Copies template -> target unless target already exists. Returns true if created.
function seed(target, template, transform) {
  const targetPath = path.join(root, target)
  if (fs.existsSync(targetPath)) {
    console.log(`  ✔ ${target} already exists — left unchanged`)
    return false
  }
  let content = fs.readFileSync(path.join(root, template), 'utf8')
  if (transform) content = transform(content)
  fs.writeFileSync(targetPath, content, 'utf8')
  console.log(`  ✔ created ${target} from ${template}`)
  return true
}

checkNode()

install('web')
install('api')

console.log('\n  Local config files:')

seed('web/.env.local', 'web/.env.local.example')

// The Functions host refuses to start without a signing key, so generate a real
// one instead of leaving the placeholder. Local-only; the file is gitignored.
seed('api/local.settings.json', 'api/local.settings.example.json', (content) =>
  content.replace('<random-secret-at-least-32-chars>', crypto.randomBytes(32).toString('hex')),
)

console.log(`
  Setup complete.

  Run the UI with mock CV data (no Azure needed):

    npm run dev            → http://localhost:5173

  To also run the API, install Azure Functions Core Tools v4, fill in the
  storage settings in api/local.settings.json, then in a second terminal:

    npm run dev:api        → http://localhost:7071

  The dev server proxies /api to the Functions host automatically.
  Set VITE_USE_MOCK_CV=0 in web/.env.local to hit the real API.
`)
