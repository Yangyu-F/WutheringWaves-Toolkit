import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const BASE_URL = 'https://wikiwiki.jp/w-w'
const DEFAULT_DELAY_MS = 1_500

const delay = (ms: number) => new Promise<void>((done) => setTimeout(done, ms))
const flag = (name: string) =>
  process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3)

function integerFlag(name: string, fallback: number) {
  const value = flag(name)
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`--${name} must be non-negative`)
  return parsed
}

function status(headers: string) {
  return [...headers.matchAll(/^HTTP\/\S+\s+(\d+)/gim)].map((match) => Number(match[1])).at(-1)
}

function header(headers: string, name: string) {
  return [...headers.matchAll(new RegExp(`^${name}:\\s*(.+)$`, 'gim'))].at(-1)?.[1]?.trim() ?? null
}

function valid(html: string) {
  return html.length >= 10_000 && !/EO_Bot_Ssid|cf-error-details|访问验证|安全验证/i.test(html)
}

async function download(url: string, headersPath: string, retries: number) {
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

function extractResonators(html: string) {
  const start = html.indexOf('<div class="tablescroll tablescroll-fix-col"')
  const end = html.indexOf('</table>', start)
  if (start < 0 || end < 0) throw new Error('WikiWiki resonator table not found')
  const entries = new Map<string, { entityId: string; title: string; url: string }>()
  for (const match of html
    .slice(start, end)
    .matchAll(/href="\/w-w\/([^"#]+)" title="([^"]+)" class="rel-wiki-page"/g)) {
    const [, encodedPath, title] = match
    if (!encodedPath || !title || title === '集音') continue
    const pagePath = decodeURIComponent(encodedPath)
    entries.set(pagePath, {
      entityId: createHash('sha256').update(pagePath).digest('hex'),
      title,
      url: `${BASE_URL}/${encodedPath}`,
    })
  }
  if (!entries.size) throw new Error('WikiWiki resonator table contained no pages')
  return [...entries.values()]
}

async function main() {
  const date = flag('date') ?? new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('--date must use YYYY-MM-DD')
  const delayMs = integerFlag('delay-ms', DEFAULT_DELAY_MS)
  const retries = integerFlag('retries', 3)
  const root = resolve('data-sources/community-wikis/raw', date, 'wikiwiki')
  await mkdir(root, { recursive: true })

  const indexPath = resolve(root, 'resonators-index.html')
  const indexHeadersPath = resolve(root, 'resonators-index.headers.txt')
  let indexHtml = await readFile(indexPath, 'utf8').catch(() => undefined)
  if (!indexHtml || !valid(indexHtml)) {
    indexHtml = await download(
      `${BASE_URL}/${encodeURIComponent('共鳴者一覧')}`,
      indexHeadersPath,
      retries,
    )
    if (!valid(indexHtml)) throw new Error('WikiWiki returned an invalid resonator index')
    await writeFile(indexPath, indexHtml, 'utf8')
  }

  const sources = extractResonators(indexHtml)
  const files = []
  const missing = []
  let requested = 0
  let reused = 0
  for (const [index, source] of sources.entries()) {
    const htmlPath = resolve(root, `${source.entityId}.html`)
    const headersPath = resolve(root, `${source.entityId}.headers.txt`)
    let html = await readFile(htmlPath, 'utf8').catch(() => undefined)
    let headers = await readFile(headersPath, 'utf8').catch(() => '')
    const wasReused = Boolean(html && valid(html))
    if (!wasReused) {
      if (requested) await delay(delayMs)
      requested += 1
      try {
        html = await download(source.url, headersPath, retries)
      } catch {
        const httpStatus = status(await readFile(headersPath, 'utf8').catch(() => ''))
        await unlink(headersPath).catch(() => undefined)
        missing.push({ ...source, reason: httpStatus ? `HTTP ${httpStatus}` : 'HTTP error' })
        continue
      }
      if (!valid(html)) {
        await unlink(headersPath).catch(() => undefined)
        missing.push({ ...source, reason: 'Invalid or access-challenge response' })
        continue
      }
      await writeFile(htmlPath, html, 'utf8')
      headers = await readFile(headersPath, 'utf8').catch(() => '')
    } else reused += 1

    files.push({
      provider: 'wikiwiki',
      entityType: 'resonator',
      ...source,
      path: `wikiwiki/${source.entityId}.html`,
      headersPath: status(headers) === 200 ? `wikiwiki/${source.entityId}.headers.txt` : null,
      bytes: Buffer.byteLength(html!),
      sha256: createHash('sha256').update(html!).digest('hex'),
      etag: header(headers, 'etag'),
      lastModified: header(headers, 'last-modified'),
      reused: wasReused,
    })
    if ((index + 1) % 10 === 0 || index + 1 === sources.length) {
      console.log(`Checked WikiWiki resonators: ${index + 1}/${sources.length}`)
    }
  }

  const manifest = {
    schemaVersion: 1,
    snapshotDate: date,
    fetchedAt: new Date().toISOString(),
    sourceIndex: `${BASE_URL}/共鳴者一覧`,
    scope: 'All published resonator pages linked by the WikiWiki resonator index',
    purpose: 'Community cross-check for resonator names, max-level stats, skills, and effects',
    index: {
      path: 'wikiwiki/resonators-index.html',
      bytes: Buffer.byteLength(indexHtml),
      sha256: createHash('sha256').update(indexHtml).digest('hex'),
    },
    files,
    missing,
    requested,
    reused,
  }
  await writeFile(
    resolve(root, 'resonators-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )
  console.log(`Saved ${files.length}/${sources.length} WikiWiki resonator pages to ${root}`)
}

await main()
