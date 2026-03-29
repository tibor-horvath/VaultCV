import { readLocalizedEnvValueWithKey } from './localeRegistry'

const defaultFetchTimeoutMs = 3000
const defaultCacheTtlMs = 60_000
const cache = new Map<string, { expiresAt: number; value: string }>()

export type ProfilePayloadSource = 'url_env'
export type ProfilePayloadErrorReason =
  | 'not_configured'
  | 'invalid_url'
  | 'host_not_allowed'
  | 'fetch_timeout'
  | 'fetch_failed'
  | 'http_non_2xx'
  | 'empty_body'

export type ReadProfilePayloadResult = {
  raw: string
  resolvedLocale: string
  source: ProfilePayloadSource
  fromCache: boolean
}

export class ProfilePayloadSourceError extends Error {
  readonly reason: ProfilePayloadErrorReason
  readonly httpStatus?: number
  readonly key: string
  readonly urlHost: string

  constructor(args: {
    reason: ProfilePayloadErrorReason
    message: string
    key?: string
    httpStatus?: number
    urlHost?: string
  }) {
    super(args.message)
    this.reason = args.reason
    this.httpStatus = args.httpStatus
    this.key = args.key ?? ''
    this.urlHost = args.urlHost ?? ''
  }
}

function parseDurationMs(raw: string | undefined, fallback: number) {
  const parsed = Number(raw ?? '')
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

function allowedHosts() {
  const raw = process.env.PROFILE_PAYLOAD_ALLOWED_HOSTS?.trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

function validatePayloadUrl(urlValue: string, key: string) {
  let parsed: URL
  try {
    parsed = new URL(urlValue)
  } catch {
    throw new ProfilePayloadSourceError({
      reason: 'invalid_url',
      message: `Invalid URL in ${key}.`,
      key,
    })
  }

  if (parsed.protocol !== 'https:') {
    throw new ProfilePayloadSourceError({
      reason: 'invalid_url',
      message: `${key} must use https.`,
      key,
      urlHost: parsed.host,
    })
  }

  const hosts = allowedHosts()
  if (hosts.length && !hosts.includes(parsed.host.toLowerCase())) {
    throw new ProfilePayloadSourceError({
      reason: 'host_not_allowed',
      message: `${key} host is not allowlisted.`,
      key,
      urlHost: parsed.host,
    })
  }

  return parsed
}

async function fetchTextWithTimeout(urlValue: string, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(urlValue, {
      method: 'GET',
      headers: { accept: 'application/json, text/plain;q=0.9, */*;q=0.1' },
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

export async function readLocalizedProfilePayload(urlPrefix: string, locale: string): Promise<ReadProfilePayloadResult> {
  const resolved = readLocalizedEnvValueWithKey(urlPrefix, locale)
  const urlValue = resolved.raw.trim()
  if (!urlValue) {
    throw new ProfilePayloadSourceError({
      reason: 'not_configured',
      message: `${urlPrefix} is not configured.`,
      key: resolved.key,
    })
  }

  const parsedUrl = validatePayloadUrl(urlValue, resolved.key)
  const cacheTtlMs = parseDurationMs(process.env.PROFILE_PAYLOAD_CACHE_TTL_MS, defaultCacheTtlMs)
  const cacheKey = `${resolved.key}|${urlValue}`
  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return {
      raw: cached.value,
      resolvedLocale: resolved.resolvedLocale,
      source: 'url_env',
      fromCache: true,
    }
  }

  const timeoutMs = parseDurationMs(process.env.PROFILE_PAYLOAD_FETCH_TIMEOUT_MS, defaultFetchTimeoutMs)
  let response: Response
  try {
    response = await fetchTextWithTimeout(urlValue, timeoutMs)
  } catch (error) {
    const isAbort = error instanceof Error && error.name === 'AbortError'
    throw new ProfilePayloadSourceError({
      reason: isAbort ? 'fetch_timeout' : 'fetch_failed',
      message: isAbort ? `Timed out fetching ${resolved.key}.` : `Failed fetching ${resolved.key}.`,
      key: resolved.key,
      urlHost: parsedUrl.host,
    })
  }

  if (!response.ok) {
    throw new ProfilePayloadSourceError({
      reason: 'http_non_2xx',
      message: `Failed fetching ${resolved.key}: HTTP ${response.status}.`,
      key: resolved.key,
      httpStatus: response.status,
      urlHost: parsedUrl.host,
    })
  }

  const raw = (await response.text()).trim()
  if (!raw) {
    throw new ProfilePayloadSourceError({
      reason: 'empty_body',
      message: `Fetched ${resolved.key} but body was empty.`,
      key: resolved.key,
      urlHost: parsedUrl.host,
    })
  }

  cache.set(cacheKey, { expiresAt: now + cacheTtlMs, value: raw })
  return {
    raw,
    resolvedLocale: resolved.resolvedLocale,
    source: 'url_env',
    fromCache: false,
  }
}

export function clearProfilePayloadCache() {
  cache.clear()
}
