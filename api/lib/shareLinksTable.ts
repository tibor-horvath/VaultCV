import crypto from 'node:crypto'
import { TableClient, type TableEntityResult } from '@azure/data-tables'

export type ShareLinkEntity = {
  partitionKey: string
  rowKey: string
  notes?: string
  createdAtEpoch: number
  expiresAtEpoch: number
  revokedAtEpoch?: number
  lastViewedAtEpoch?: number
  viewCount?: number
}

const DEFAULT_TABLE_NAME = 'sharelinks'
const PARTITION_KEY = 'links'

function requiredEnv(name: string, value: string | undefined) {
  const trimmed = (value ?? '').trim()
  if (!trimmed) throw new Error(`Missing required env var: ${name}`)
  return trimmed
}

function storageConnectionString() {
  // Prefer dedicated connection string; fall back to Functions storage.
  const cs = (process.env.AZURE_STORAGE_CONNECTION_STRING ?? process.env.AzureWebJobsStorage ?? '').trim()
  return requiredEnv('AZURE_STORAGE_CONNECTION_STRING (or AzureWebJobsStorage)', cs)
}

function tableName() {
  return (process.env.CV_SHARELINKS_TABLE ?? '').trim() || DEFAULT_TABLE_NAME
}

let cachedClient: TableClient | undefined
function getClient() {
  if (!cachedClient) {
    cachedClient = TableClient.fromConnectionString(storageConnectionString(), tableName())
  }
  return cachedClient
}

function nowEpochSeconds() {
  return Math.floor(Date.now() / 1000)
}

function newShareId() {
  // 128-bit random id encoded as base64url (22 chars).
  return crypto.randomBytes(16).toString('base64url')
}

function clampText(input: string | undefined, maxLen: number) {
  const trimmed = (input ?? '').trim()
  if (!trimmed) return undefined
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed
}

export type CreateShareLinkInput = {
  notes?: string
  expiresAtEpoch: number
}

export type CreateShareLinkResult = {
  id: string
  entity: ShareLinkEntity
}

export async function createShareLink(input: CreateShareLinkInput): Promise<CreateShareLinkResult> {
  const createdAtEpoch = nowEpochSeconds()
  const expiresAtEpoch = input.expiresAtEpoch
  if (!Number.isFinite(expiresAtEpoch) || expiresAtEpoch <= createdAtEpoch) {
    throw new Error('expiresAtEpoch must be a future epoch seconds value')
  }
  const id = newShareId()
  const entity: ShareLinkEntity = {
    partitionKey: PARTITION_KEY,
    rowKey: id,
    notes: clampText(input.notes, 1000),
    createdAtEpoch,
    expiresAtEpoch,
    viewCount: 0,
  }
  await getClient().createEntity(entity)
  return { id, entity }
}

export async function getShareLink(id: string): Promise<ShareLinkEntity | null> {
  const trimmed = (id ?? '').trim()
  if (!trimmed) return null
  try {
    const result = (await getClient().getEntity(PARTITION_KEY, trimmed)) as TableEntityResult<Record<string, unknown>>
    return {
      partitionKey: PARTITION_KEY,
      rowKey: trimmed,
      notes: result.notes ? String(result.notes) : undefined,
      createdAtEpoch: Number(result.createdAtEpoch ?? 0),
      expiresAtEpoch: Number(result.expiresAtEpoch ?? 0),
      revokedAtEpoch: result.revokedAtEpoch != null ? Number(result.revokedAtEpoch) : undefined,
      lastViewedAtEpoch: result.lastViewedAtEpoch != null ? Number(result.lastViewedAtEpoch) : undefined,
      viewCount: result.viewCount != null ? Number(result.viewCount) : undefined,
    }
  } catch (e: any) {
    if (e?.statusCode === 404) return null
    throw e
  }
}

export type ShareLinkValidationResult =
  | { ok: true; entity: ShareLinkEntity }
  | { ok: false; reason: 'not_found' | 'revoked' | 'expired' }

export async function validateShareLink(id: string, nowEpoch: number = nowEpochSeconds()): Promise<ShareLinkValidationResult> {
  const entity = await getShareLink(id)
  if (!entity) return { ok: false, reason: 'not_found' }
  if (entity.revokedAtEpoch && entity.revokedAtEpoch <= nowEpoch) return { ok: false, reason: 'revoked' }
  if (!entity.expiresAtEpoch || entity.expiresAtEpoch <= nowEpoch) return { ok: false, reason: 'expired' }
  return { ok: true, entity }
}

export async function markShareLinkViewed(id: string): Promise<void> {
  const entity = await getShareLink(id)
  if (!entity) return
  const lastViewedAtEpoch = nowEpochSeconds()
  const viewCount = (entity.viewCount ?? 0) + 1
  await getClient().updateEntity(
    {
      partitionKey: PARTITION_KEY,
      rowKey: id,
      lastViewedAtEpoch,
      viewCount,
    },
    'Merge',
  )
}

export async function revokeShareLink(id: string): Promise<boolean> {
  const entity = await getShareLink(id)
  if (!entity) return false
  const revokedAtEpoch = nowEpochSeconds()
  await getClient().updateEntity({ partitionKey: PARTITION_KEY, rowKey: id, revokedAtEpoch }, 'Merge')
  return true
}

export async function listShareLinks(limit: number = 200): Promise<ShareLinkEntity[]> {
  const out: ShareLinkEntity[] = []
  const client = getClient()
  const query = client.listEntities<Record<string, unknown>>({
    queryOptions: { filter: `PartitionKey eq '${PARTITION_KEY}'` },
  })
  for await (const e of query) {
    out.push({
      partitionKey: PARTITION_KEY,
      rowKey: String(e.rowKey),
      notes: e.notes ? String(e.notes) : undefined,
      createdAtEpoch: Number(e.createdAtEpoch ?? 0),
      expiresAtEpoch: Number(e.expiresAtEpoch ?? 0),
      revokedAtEpoch: e.revokedAtEpoch != null ? Number(e.revokedAtEpoch) : undefined,
      lastViewedAtEpoch: e.lastViewedAtEpoch != null ? Number(e.lastViewedAtEpoch) : undefined,
      viewCount: e.viewCount != null ? Number(e.viewCount) : undefined,
    })
    if (out.length >= limit) break
  }
  out.sort((a, b) => (b.createdAtEpoch ?? 0) - (a.createdAtEpoch ?? 0))
  return out
}

