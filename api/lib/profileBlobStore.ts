import { BlobServiceClient } from '@azure/storage-blob'

function requiredEnv(name: string, value: string | undefined) {
  const trimmed = (value ?? '').trim()
  if (!trimmed) throw new Error(`Missing required env var: ${name}`)
  return trimmed
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

function blobName(kind: 'public' | 'private') {
  if (kind === 'public') return requiredEnv('CV_PUBLIC_PROFILE_BLOB', process.env.CV_PUBLIC_PROFILE_BLOB)
  return requiredEnv('CV_PRIVATE_PROFILE_BLOB', process.env.CV_PRIVATE_PROFILE_BLOB)
}

function getBlobClient(kind: 'public' | 'private') {
  const service = BlobServiceClient.fromConnectionString(storageConnectionString())
  const container = service.getContainerClient(containerName())
  return container.getBlockBlobClient(blobName(kind))
}

export async function readProfileJson(kind: 'public' | 'private') {
  const client = getBlobClient(kind)
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

export async function writeProfileJson(kind: 'public' | 'private', jsonText: string) {
  const client = getBlobClient(kind)
  await client.upload(jsonText, Buffer.byteLength(jsonText), {
    blobHTTPHeaders: {
      blobContentType: 'application/json; charset=utf-8',
      blobCacheControl: 'no-store',
    },
  })
}

