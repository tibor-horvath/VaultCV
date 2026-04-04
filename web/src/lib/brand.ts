const DEFAULT_BRAND_NAME = 'VaultCV'
const DEFAULT_BRAND_REPO_URL = 'https://github.com/tibor-horvath/VaultCV'
const DEFAULT_BRAND_LINKEDIN_URL = 'https://www.linkedin.com/in/htibor/'
const DEFAULT_BRAND_COPYRIGHT_NAME = 'Tibor Horvath'
const DEFAULT_APP_VERSION = '0.0.0'

function formatBrandDisplayName(name: string, version: string): string {
  return `${name} v${version}`
}

function readEnvString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export type Brand = {
  name: string
  version: string
  displayName: string
  repoUrl: string
  linkedInUrl: string
  copyrightName: string
}

export function getBrand(): Brand {
  const env = import.meta.env as unknown as Record<string, unknown>
  const name = readEnvString(env.VITE_BRAND_NAME) ?? DEFAULT_BRAND_NAME
  const version = readEnvString(env.VITE_APP_VERSION) ?? DEFAULT_APP_VERSION
  const repoUrl = readEnvString(env.VITE_BRAND_REPO_URL) ?? DEFAULT_BRAND_REPO_URL
  const linkedInUrl = readEnvString(env.VITE_BRAND_LINKEDIN_URL) ?? DEFAULT_BRAND_LINKEDIN_URL
  const copyrightName = readEnvString(env.VITE_BRAND_COPYRIGHT_NAME) ?? DEFAULT_BRAND_COPYRIGHT_NAME
  const displayName = formatBrandDisplayName(name, version)

  return { name, version, displayName, repoUrl, linkedInUrl, copyrightName }
}

