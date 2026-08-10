import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const API_ORIGIN = 'https://api.kurobbs.com'
const WIKI_TYPE = '9'
const DEFAULT_DELAY_MS = 1_000
const DEFAULT_RETRIES = 3
const execFileAsync = promisify(execFile)
let preferCurl = false

const catalogues = [
  { key: 'resonators', id: 1105, name: '共鸣者' },
  { key: 'weapons', id: 1106, name: '武器' },
  { key: 'echoes', id: 1107, name: '声骸' },
  { key: 'sonatas', id: 1219, name: '合鸣效果' },
  { key: 'enemies', id: 1158, name: '敌人' },
] as const

interface SnapshotFile {
  path: string
  sha256: string
  bytes: number
  sourceUrl: string
  catalogueId?: number
  catalogueName?: string
  recordCount?: number
  onlineVersion?: string | null
}

interface ApiEnvelope {
  code?: number
  msg?: string
  data?: unknown
  success?: boolean
}

interface CatalogueRecord {
  name?: string
  content?: {
    linkConfig?: { entryId?: string }
    linkId?: string
  }
}

interface EntrySnapshot {
  entityName: string
  entityType: string
  entryId: string
  path: string
  sha256: string
  bytes: number
}

const delay = (milliseconds: number) =>
  new Promise<void>((resolveDelay) => setTimeout(resolveDelay, milliseconds))

function readFlag(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length)
}

function requirePositiveInteger(value: string | undefined, fallback: number, flag: string): number {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`--${flag} must be a non-negative integer`)
  }
  return parsed
}

async function fetchJson(
  path: string,
  body: URLSearchParams,
  retries: number,
): Promise<{ envelope: ApiEnvelope; sourceUrl: string }> {
  const sourceUrl = `${API_ORIGIN}${path}`
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const envelope = await requestEnvelope(sourceUrl, body)
      if (envelope.code !== 200 || envelope.success !== true) {
        throw new Error(`API ${envelope.code ?? 'unknown'}: ${envelope.msg ?? 'unknown error'}`)
      }
      return { envelope, sourceUrl }
    } catch (error) {
      lastError = error
      if (attempt < retries) await delay(500 * 2 ** attempt)
    }
  }

  throw lastError
}

async function requestEnvelope(sourceUrl: string, body: URLSearchParams): Promise<ApiEnvelope> {
  let fetchError: unknown
  if (!preferCurl) {
    try {
      const response = await fetch(sourceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          source: '2',
          wiki_type: WIKI_TYPE,
        },
        body,
        signal: AbortSignal.timeout(30_000),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
      return (await response.json()) as ApiEnvelope
    } catch (error) {
      fetchError = error
      preferCurl = true
    }
  }

  try {
    const { stdout } = await execFileAsync(
      'curl',
      [
        '--fail-with-body',
        '--location',
        '--silent',
        '--show-error',
        '--compressed',
        '--max-time',
        '30',
        '--request',
        'POST',
        sourceUrl,
        '--header',
        'Content-Type: application/x-www-form-urlencoded',
        '--header',
        'source: 2',
        '--header',
        `wiki_type: ${WIKI_TYPE}`,
        '--data',
        body.toString(),
      ],
      { maxBuffer: 50 * 1024 * 1024 },
    )
    return JSON.parse(stdout) as ApiEnvelope
  } catch (curlError) {
    throw new AggregateError(
      fetchError === undefined ? [curlError] : [fetchError, curlError],
      'Node fetch and curl fallback both failed',
    )
  }
}

async function fetchEntry(entryId: string, retries: number): Promise<ApiEnvelope> {
  const sourceUrl = `${API_ORIGIN}/wiki/core/catalogue/item/getEntryDetail`
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { stdout } = await execFileAsync(
        'curl',
        [
          '--fail-with-body',
          '--location',
          '--silent',
          '--show-error',
          '--compressed',
          '--max-time',
          '45',
          '--request',
          'POST',
          sourceUrl,
          '--header',
          'Content-Type: application/x-www-form-urlencoded;charset=UTF-8',
          '--header',
          'source: h5',
          '--header',
          `wiki_type: ${WIKI_TYPE}`,
          '--header',
          'devcode:',
          '--header',
          'Origin: https://wiki.kurobbs.com',
          '--header',
          'Referer: https://wiki.kurobbs.com/',
          '--data-raw',
          `id=${entryId}`,
        ],
        { maxBuffer: 50 * 1024 * 1024 },
      )
      const envelope = JSON.parse(stdout) as ApiEnvelope
      if (envelope.code !== 200 || envelope.success !== true) {
        throw new Error(`Entry ${entryId}: API ${envelope.code}: ${envelope.msg}`)
      }
      return envelope
    } catch (error) {
      lastError = error
      if (attempt < retries) await delay(750 * 2 ** attempt)
    }
  }
  throw lastError
}

function catalogueRecords(envelope: ApiEnvelope): CatalogueRecord[] {
  const data = envelope.data as { results?: { records?: CatalogueRecord[] } } | undefined
  return data?.results?.records ?? []
}

function recordEntryId(record: CatalogueRecord): string | undefined {
  return record.content?.linkConfig?.entryId ?? record.content?.linkId
}

function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

async function saveJson(
  outputDirectory: string,
  filename: string,
  value: unknown,
): Promise<Pick<SnapshotFile, 'path' | 'sha256' | 'bytes'>> {
  const contents = serialize(value)
  await writeFile(resolve(outputDirectory, filename), contents, 'utf8')
  return {
    path: filename,
    sha256: createHash('sha256').update(contents).digest('hex'),
    bytes: Buffer.byteLength(contents),
  }
}

function catalogueMetadata(envelope: ApiEnvelope) {
  const data = envelope.data as
    | {
        results?: { records?: unknown[]; total?: number }
        catalogPageVersionOnline?: string | null
      }
    | undefined
  return {
    recordCount: data?.results?.total ?? data?.results?.records?.length,
    onlineVersion: data?.catalogPageVersionOnline ?? null,
  }
}

async function main() {
  const snapshotDate = readFlag('date') ?? new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) {
    throw new Error('--date must use YYYY-MM-DD')
  }

  const delayMs = requirePositiveInteger(readFlag('delay-ms'), DEFAULT_DELAY_MS, 'delay-ms')
  const retries = requirePositiveInteger(readFlag('retries'), DEFAULT_RETRIES, 'retries')
  const outputDirectory = resolve('data-sources/kuro-wiki/raw', snapshotDate)
  await mkdir(outputDirectory, { recursive: true })

  const files: SnapshotFile[] = []
  const catalogueResponses = new Map<string, ApiEnvelope>()
  const treeResult = await fetchJson(
    '/wiki/core/catalogue/config/getTree',
    new URLSearchParams(),
    retries,
  )
  files.push({
    ...(await saveJson(outputDirectory, 'catalogue-tree.json', treeResult.envelope)),
    sourceUrl: treeResult.sourceUrl,
  })

  for (const [index, catalogue] of catalogues.entries()) {
    if (index > 0 || files.length > 0) await delay(delayMs)
    const result = await fetchJson(
      '/wiki/core/catalogue/item/getPage',
      new URLSearchParams({ catalogueId: String(catalogue.id), page: '1', limit: '1000' }),
      retries,
    )
    catalogueResponses.set(catalogue.key, result.envelope)
    files.push({
      ...(await saveJson(outputDirectory, `${catalogue.key}.json`, result.envelope)),
      ...catalogueMetadata(result.envelope),
      sourceUrl: result.sourceUrl,
      catalogueId: catalogue.id,
      catalogueName: catalogue.name,
    })
  }

  const entrySnapshots: EntrySnapshot[] = []
  const entryCatalogues = catalogues.filter((catalogue) => catalogue.key !== 'enemies')
  const entryQueue = entryCatalogues.flatMap((catalogue) =>
    catalogueRecords(catalogueResponses.get(catalogue.key) ?? {}).flatMap((record) => {
      const entryId = recordEntryId(record)
      return entryId && record.name
        ? [{ entityName: record.name, entityType: catalogue.key, entryId }]
        : []
    }),
  )
  const seenEntryIds = new Set<string>()
  const uniqueEntries = entryQueue.filter((entry) => {
    if (seenEntryIds.has(entry.entryId)) return false
    seenEntryIds.add(entry.entryId)
    return true
  })

  for (const [index, entry] of uniqueEntries.entries()) {
    await delay(delayMs)
    const directory = resolve(outputDirectory, 'entries', entry.entityType)
    await mkdir(directory, { recursive: true })
    const envelope = await fetchEntry(entry.entryId, retries)
    const filename = `${entry.entryId}.json`
    const saved = await saveJson(directory, filename, envelope)
    entrySnapshots.push({
      ...entry,
      path: `entries/${entry.entityType}/${filename}`,
      sha256: saved.sha256,
      bytes: saved.bytes,
    })
    if ((index + 1) % 10 === 0 || index + 1 === uniqueEntries.length) {
      console.log(`Downloaded official entries: ${index + 1}/${uniqueEntries.length}`)
    }
  }

  const treeData = treeResult.envelope.data as
    { catalogPageVersionOnline?: string | null } | undefined
  const manifest = {
    schemaVersion: 1,
    source: 'Kuro Games Wuthering Waves Wiki',
    sourceHome: 'https://wiki.kurobbs.com/mc/home',
    apiOrigin: API_ORIGIN,
    wikiType: WIKI_TYPE,
    snapshotDate,
    fetchedAt: new Date().toISOString(),
    catalogueTreeOnlineVersion: treeData?.catalogPageVersionOnline ?? null,
    scope: catalogues.map(({ key, id, name }) => ({ key, id, name })),
    entryBodies: {
      downloaded: true,
      endpoint: `${API_ORIGIN}/wiki/core/catalogue/item/getEntryDetail`,
      count: entrySnapshots.length,
      entries: entrySnapshots,
    },
    media: {
      downloaded: false,
      reason: 'Only source URLs and metadata are retained by default.',
    },
    files,
  }
  await saveJson(outputDirectory, 'manifest.json', manifest)

  console.log(`Saved Kuro Wiki snapshot to ${outputDirectory}`)
  for (const file of files) {
    const count = file.recordCount === undefined ? '' : ` (${file.recordCount} records)`
    console.log(`- ${file.path}${count}`)
  }
}

await main()
