const DEFAULT_BRAND_NAME = 'VaultCV'
const DEFAULT_BRAND_REPO_URL = 'https://github.com/tibor-horvath/VaultCV'
const DEFAULT_BRAND_LINKEDIN_URL = 'https://www.linkedin.com/in/htibor/'
const DEFAULT_BRAND_COPYRIGHT_NAME = 'Tibor Horvath'

function readEnvString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export type Brand = {
  name: string
  repoUrl: string
  linkedInUrl: string
  copyrightName: string
}

export function getBrand(): Brand {
  const env = import.meta.env as unknown as Record<string, unknown>
  const name = readEnvString(env.VITE_BRAND_NAME) ?? DEFAULT_BRAND_NAME
  const repoUrl = readEnvString(env.VITE_BRAND_REPO_URL) ?? DEFAULT_BRAND_REPO_URL
  const linkedInUrl = readEnvString(env.VITE_BRAND_LINKEDIN_URL) ?? DEFAULT_BRAND_LINKEDIN_URL
  const copyrightName = readEnvString(env.VITE_BRAND_COPYRIGHT_NAME) ?? DEFAULT_BRAND_COPYRIGHT_NAME

  return { name, repoUrl, linkedInUrl, copyrightName }
}

