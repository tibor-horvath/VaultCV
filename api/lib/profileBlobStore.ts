import { BlobServiceClient } from '@azure/storage-blob'

function requiredEnv(name: string, value: string | undefined) {
  const trimmed = (value ?? '').trim()
  if (!trimmed) throw new Error(`Missing required env var: ${name}`)
  return trimmed
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
  const download = await client.download()
  const body = await download.blobBody
  if (!body) return ''
  return await body.text()
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

