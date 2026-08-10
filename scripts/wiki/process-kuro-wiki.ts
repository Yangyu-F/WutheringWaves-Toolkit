import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface RawManifest {
  entryBodies: {
    entries: Array<{
      entityName: string
      entityType: string
      entryId: string
      path: string
      sha256: string
    }>
  }
}

interface OfficialEnvelope {
  data?: {
    id?: string
    name?: string
    currentVersion?: string
    onlineVersion?: string
    lastUpdateTime?: number | string
    content?: unknown
  }
}

const snapshotDate =
  process.argv.find((argument) => argument.startsWith('--date='))?.slice('--date='.length) ??
  new Date().toISOString().slice(0, 10)

function decodeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&middot;': '·',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  }
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(nbsp|middot|amp|lt|gt|quot|#39);/g, (entity) => entities[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim()
}

function collectText(value: unknown, output: string[]): void {
  if (typeof value === 'string') {
    const text = decodeHtml(value)
    if (text) output.push(text)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectText(item, output)
    return
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (['contentUrl', 'backgroundImage', 'url', 'img'].includes(key)) continue
      collectText(child, output)
    }
  }
}

function collectHeadings(value: unknown, output: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectHeadings(item, output)
    return
  }
  if (!value || typeof value !== 'object') return
  const object = value as Record<string, unknown>
  if (typeof object.title === 'string') {
    const title = decodeHtml(object.title)
    if (title) output.push(title)
  }
  for (const child of Object.values(object)) collectHeadings(child, output)
}

async function main() {
  const rawRoot = resolve('data-sources/kuro-wiki/raw', snapshotDate)
  const outputRoot = resolve('data-sources/kuro-wiki/processed', snapshotDate)
  const manifest = JSON.parse(
    await readFile(resolve(rawRoot, 'manifest.json'), 'utf8'),
  ) as RawManifest
  const index = []

  for (const entry of manifest.entryBodies.entries) {
    const envelope = JSON.parse(
      await readFile(resolve(rawRoot, entry.path), 'utf8'),
    ) as OfficialEnvelope
    const textParts: string[] = []
    const headings: string[] = []
    collectText(envelope.data?.content, textParts)
    collectHeadings(envelope.data?.content, headings)
    const processed = {
      schemaVersion: 1,
      verificationStatus: 'candidate',
      source: 'kuro-wiki-entry-detail',
      sourceSnapshotDate: snapshotDate,
      sourceSha256: entry.sha256,
      entityType: entry.entityType,
      entityName: envelope.data?.name ?? entry.entityName,
      entryId: envelope.data?.id ?? entry.entryId,
      currentVersion: envelope.data?.currentVersion ?? null,
      onlineVersion: envelope.data?.onlineVersion ?? null,
      lastUpdateTime: envelope.data?.lastUpdateTime ?? null,
      headings: [...new Set(headings)],
      searchableText: [...new Set(textParts)].join('\n'),
    }
    const directory = resolve(outputRoot, entry.entityType)
    await mkdir(directory, { recursive: true })
    const path = `${entry.entityType}/${entry.entryId}.json`
    await writeFile(resolve(outputRoot, path), `${JSON.stringify(processed, null, 2)}\n`, 'utf8')
    index.push({
      entityType: processed.entityType,
      entityName: processed.entityName,
      entryId: processed.entryId,
      path,
      currentVersion: processed.currentVersion,
      onlineVersion: processed.onlineVersion,
      headings: processed.headings,
    })
  }

  await writeFile(
    resolve(outputRoot, 'index.json'),
    `${JSON.stringify({ schemaVersion: 1, snapshotDate, entries: index }, null, 2)}\n`,
    'utf8',
  )
  console.log(`Processed ${index.length} official Wiki entries into ${outputRoot}`)
}

await main()
