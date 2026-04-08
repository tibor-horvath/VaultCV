import { BlobServiceClient } from '@azure/storage-blob'

function requiredEnv(name: string, value: string | undefined) {
  const trimmed = (value ?? '').trim()
  if (!trimmed) throw new Error(`Missing required env var: ${name}`)
  return trimmed
}

function safeSlugFromName(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .replace(/-+/g, '-')
  return slug
}

async function streamToText(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

function storageConnectionString() {
  const cs = (process.env.CV_PROFILE_STORAGE_CONNECTION_STRING ?? process.env.AZURE_STORAGE_CONNECTION_STRING ?? '').trim()
  return requiredEnv('CV_PROFILE_STORAGE_CONNECTION_STRING (or AZURE_STORAGE_CONNECTION_STRING)', cs)
}

function containerName() {
  return requiredEnv('CV_PROFILE_CONTAINER', process.env.CV_PROFILE_CONTAINER)
}

function getContainerClient() {
  const service = BlobServiceClient.fromConnectionString(storageConnectionString())
  return service.getContainerClient(containerName())
}

function getBlobClientByName(name: string) {
  return getContainerClient().getBlockBlobClient(name)
}

function blobNameV2(args: { kind: 'public' | 'private'; locale: string; slugFromName: string }) {
  const slug = safeSlugFromName(args.slugFromName)
  if (!slug) throw new Error('Profile slug is empty (basics.name is required).')
  const locale = args.locale.trim().toLowerCase()
  if (!locale) throw new Error('Locale is required.')
  return `${slug}-${args.kind}-profile-${locale}.json`
}

function settingsBlobName(slugFromName: string) {
  const slug = safeSlugFromName(slugFromName)
  if (!slug) throw new Error('Profile slug is empty (basics.name is required).')
  return `${slug}-settings.json`
}

async function readBlobText(client: ReturnType<typeof getBlobClientByName>) {
  try {
    const download = await client.download()
    // In Node (Azure Functions), `readableStreamBody` is available.
    const nodeStream = (download as any).readableStreamBody as NodeJS.ReadableStream | undefined
    if (nodeStream) return await streamToText(nodeStream)

    // In browser-like runtimes, `blobBody` can be available.
    const blobBody = (download as any).blobBody as Blob | undefined
    if (blobBody) return await blobBody.text()

    return ''
  } catch (e: any) {
    // If the blob doesn't exist yet, treat as empty profile.
    const status = e?.statusCode ?? e?.details?.errorCode
    if (status === 404 || e?.statusCode === 404) return ''
    throw e
  }
}

async function writeBlobText(client: ReturnType<typeof getBlobClientByName>, jsonText: string) {
  await client.upload(jsonText, Buffer.byteLength(jsonText), {
    blobHTTPHeaders: {
      blobContentType: 'application/json; charset=utf-8',
      blobCacheControl: 'no-store',
    },
  })
}

export async function readProfileJson(kind: 'public' | 'private') {
  throw new Error(`Legacy profile blob naming is no longer supported (${kind}).`)
}

export async function writeProfileJson(kind: 'public' | 'private', jsonText: string) {
  throw new Error(`Legacy profile blob naming is no longer supported (${kind}).`)
}

export async function readProfileJsonV2(args: { kind: 'public' | 'private'; locale: string; slugFromName: string; legacyFallback?: boolean }) {
  const name = blobNameV2(args)
  const primary = await readBlobText(getBlobClientByName(name))
  if (primary.trim()) return primary
  return primary
}

export async function writeProfileJsonV2(args: { kind: 'public' | 'private'; locale: string; slugFromName: string; jsonText: string }) {
  const name = blobNameV2(args)
  return writeBlobText(getBlobClientByName(name), args.jsonText)
}

export async function deleteProfileJsonV2(args: { kind: 'public'; locale: string; slugFromName: string }) {
  const name = blobNameV2(args)
  const client = getBlobClientByName(name)
  try {
    await client.delete()
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && (e as Record<string, unknown>).statusCode === 404) return
    throw e
  }
}

export async function readSettingsJson(args: { slugFromName: string }) {
  const name = settingsBlobName(args.slugFromName)
  return readBlobText(getBlobClientByName(name))
}

export async function writeSettingsJson(args: { slugFromName: string; jsonText: string }) {
  const name = settingsBlobName(args.slugFromName)
  return writeBlobText(getBlobClientByName(name), args.jsonText)
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array))
  }
  return Buffer.concat(chunks)
}

function profileImageBlobName(slug: string): string {
  const safe = safeSlugFromName(slug)
  if (!safe) throw new Error('Profile slug is empty.')
  return `${safe}-profile-image`
}

export async function writeProfileImage(slug: string, imageBuffer: Buffer, contentType: string): Promise<void> {
  const client = getBlobClientByName(profileImageBlobName(slug))
  await client.upload(imageBuffer, imageBuffer.byteLength, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: 'no-store',
    },
  })
}

export async function readProfileImage(slug: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const client = getBlobClientByName(profileImageBlobName(slug))
  try {
    const download = await client.download()
    const contentType = download.contentType ?? 'application/octet-stream'
    const nodeStream = (download as any).readableStreamBody as NodeJS.ReadableStream | undefined
    if (nodeStream) {
      const buffer = await streamToBuffer(nodeStream)
      return { buffer, contentType }
    }
    const blobBody = (download as any).blobBody as Blob | undefined
    if (blobBody) {
      const arrayBuffer = await blobBody.arrayBuffer()
      return { buffer: Buffer.from(arrayBuffer), contentType }
    }
    return null
  } catch (e: any) {
    if (e?.statusCode === 404) return null
    throw e
  }
}

export async function deleteProfileImage(slug: string): Promise<void> {
  const client = getBlobClientByName(profileImageBlobName(slug))
  try {
    await client.delete()
  } catch (e: any) {
    if (e?.statusCode === 404) return
    throw e
  }
}

