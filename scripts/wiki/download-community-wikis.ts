import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const DEFAULT_DELAY_MS = 1_500
const DEFAULT_RETRIES = 3

const phaseOneWikiWikiSources = [
  {
    provider: 'bwiki',
    entityId: 'yangyang',
    entityType: 'resonator',
    title: '共鸣者/秧秧',
    url: 'https://wiki.biligame.com/wutheringwaves/共鸣者/秧秧',
  },
  {
    provider: 'bwiki',
    entityId: 'qiangu-fuliu',
    entityType: 'weapon',
    title: '武器/千古洑流',
    url: 'https://wiki.biligame.com/wutheringwaves/武器/千古洑流',
  },
  {
    provider: 'bwiki',
    entityId: 'feilian-zhixing',
    entityType: 'echo',
    title: '声骸/飞廉之猩',
    url: 'https://wiki.biligame.com/wutheringwaves/声骸/飞廉之猩',
  },
  {
    provider: 'bwiki',
    entityId: 'xiaogu-changfeng',
    entityType: 'sonata',
    title: '声骸合鸣/啸谷长风',
    url: 'https://wiki.biligame.com/wutheringwaves/声骸合鸣/啸谷长风',
  },
  {
    provider: 'wikiwiki',
    entityId: 'yangyang',
    entityType: 'resonator',
    title: '秧秧',
    url: 'https://wikiwiki.jp/w-w/秧秧',
  },
  {
    provider: 'wikiwiki',
    entityId: 'qiangu-fuliu',
    entityType: 'weapon',
    title: '千古の湖水',
    url: 'https://wikiwiki.jp/w-w/千古の湖水',
  },
  {
    provider: 'wikiwiki',
    entityId: 'feilian-zhixing',
    entityType: 'echo',
    title: '飛廉の大猿',
    url: 'https://wikiwiki.jp/w-w/飛廉の大猿',
  },
  {
    provider: 'wikiwiki',
    entityId: 'xiaogu-changfeng',
    entityType: 'sonata',
    title: '谷を突き抜ける長風',
    url: 'https://wikiwiki.jp/w-w/谷を突き抜ける長風',
  },
] as const

const bwikiCatalogues = [
  { file: 'resonators.json', entityType: 'resonator', prefix: '共鸣者' },
  { file: 'weapons.json', entityType: 'weapon', prefix: '武器' },
  { file: 'echoes.json', entityType: 'echo', prefix: '声骸' },
  { file: 'sonatas.json', entityType: 'sonata', prefix: '声骸合鸣' },
] as const

interface OfficialCatalogueEnvelope {
  data?: { results?: { records?: Array<{ name?: string; content?: { linkId?: string } }> } }
}

async function buildSources(snapshotDate: string) {
  const result: Array<{
    provider: string
    entityId: string
    entityType: string
    title: string
    url: string
  }> = []
  for (const catalogue of bwikiCatalogues) {
    const path = resolve('data-sources/kuro-wiki/raw', snapshotDate, catalogue.file)
    const envelope = JSON.parse(await readFile(path, 'utf8')) as OfficialCatalogueEnvelope
    for (const record of envelope.data?.results?.records ?? []) {
      if (!record.name) continue
      result.push({
        provider: 'bwiki',
        entityId: record.content?.linkId ?? createHash('sha256').update(record.name).digest('hex'),
        entityType: catalogue.entityType,
        title: `${catalogue.prefix}/${record.name}`,
        url: `https://wiki.biligame.com/wutheringwaves/${catalogue.prefix}/${record.name}`,
      })
    }
  }
  if (readFlag('include-wikiwiki-phase-one') === 'true') {
    result.push(...phaseOneWikiWikiSources.filter((source) => source.provider === 'wikiwiki'))
  }
  return result
}

const delay = (milliseconds: number) =>
  new Promise<void>((resolveDelay) => setTimeout(resolveDelay, milliseconds))

function readFlag(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length)
}

function positiveInteger(value: string | undefined, fallback: number, flag: string): number {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`--${flag} must be a non-negative integer`)
  }
  return parsed
}

async function download(url: string, headersPath: string, retries: number): Promise<string> {
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
          '--dump-header',
          headersPath,
          '--user-agent',
          'WutheringWaves-Toolkit source snapshot/0.1 (+https://github.com/Yangyu-F/WutheringWaves-Toolkit)',
          url,
        ],
        { maxBuffer: 50 * 1024 * 1024 },
      )
      return stdout
    } catch (error) {
      lastError = error
      if (attempt < retries) await delay(750 * 2 ** attempt)
    }
  }
  throw lastError
}

function headerValue(headers: string, name: string): string | null {
  const matches = [...headers.matchAll(new RegExp(`^${name}:\\s*(.+)$`, 'gim'))]
  return matches.at(-1)?.[1]?.trim() ?? null
}

async function main() {
  const snapshotDate = readFlag('date') ?? new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) {
    throw new Error('--date must use YYYY-MM-DD')
  }
  const delayMs = positiveInteger(readFlag('delay-ms'), DEFAULT_DELAY_MS, 'delay-ms')
  const retries = positiveInteger(readFlag('retries'), DEFAULT_RETRIES, 'retries')
  const root = resolve('data-sources/community-wikis/raw', snapshotDate)
  await mkdir(root, { recursive: true })
  const sources = await buildSources(snapshotDate)

  const files = []
  const missing = []
  let blocked: { provider: string; url: string; reason: string } | null = null
  for (const [index, source] of sources.entries()) {
    if (index > 0) await delay(delayMs)
    const providerDirectory = resolve(root, source.provider)
    await mkdir(providerDirectory, { recursive: true })
    const relativePath = `${source.provider}/${source.entityId}.html`
    const headersRelativePath = `${source.provider}/${source.entityId}.headers.txt`
    const headersPath = resolve(root, headersRelativePath)
    let html: string
    try {
      html = await download(source.url, headersPath, retries)
    } catch {
      await unlink(headersPath).catch(() => undefined)
      missing.push({ ...source, reason: 'HTTP error or page not created' })
      continue
    }
    if (html.includes('EO_Bot_Ssid') || html.includes('cf-error-details')) {
      await unlink(headersPath).catch(() => undefined)
      blocked = {
        provider: source.provider,
        url: source.url,
        reason: 'The provider returned an automated-access challenge.',
      }
      break
    }
    await writeFile(resolve(root, relativePath), html, 'utf8')
    const headers = await readFile(headersPath, 'utf8')
    files.push({
      ...source,
      path: relativePath,
      headersPath: headersRelativePath,
      bytes: Buffer.byteLength(html),
      sha256: createHash('sha256').update(html).digest('hex'),
      etag: headerValue(headers, 'etag'),
      lastModified: headerValue(headers, 'last-modified'),
    })
    if ((index + 1) % 10 === 0 || index + 1 === sources.length) {
      console.log(`Checked community pages: ${index + 1}/${sources.length}`)
    }
  }

  const manifest = {
    schemaVersion: 1,
    snapshotDate,
    fetchedAt: new Date().toISOString(),
    scope:
      'All official resonator, weapon, echo, and sonata catalogue entities for BWiki; optional Phase 1 WikiWiki entities',
    purpose: 'Community cross-check for names, aliases, max-level stats, and effects',
    files,
    missing,
    blocked,
  }
  await writeFile(resolve(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`Saved community Wiki snapshot to ${root}`)
  for (const file of files) console.log(`- ${file.provider}/${file.entityId}: ${file.bytes} bytes`)
}

await main()
