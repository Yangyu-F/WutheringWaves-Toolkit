import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const DEFAULT_DELAY_MS = 1_500
const DEFAULT_RETRIES = 3

interface BwikiTitleOverride {
  title: string
  evidenceUrl: string
  verifiedAt: string
  reason: string
}

type BwikiTitleOverrides = Record<string, BwikiTitleOverride>

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
] as const

const bwikiCatalogues = [
  { file: 'resonators.json', entityType: 'resonator', prefix: '共鸣者' },
  { file: 'weapons.json', entityType: 'weapon', prefix: '武器' },
  { file: 'echoes.json', entityType: 'echo', prefix: '声骸' },
  { file: 'sonatas.json', entityType: 'sonata', prefix: '声骸合鸣' },
] as const

interface OfficialCatalogueEnvelope {
  data?: {
    results?: {
      records?: Array<{
        name?: string
        content?: { linkId?: string; linkUrl?: string; linkConfig?: { entryId?: string } }
      }>
    }
  }
}

function officialEntryId(content: {
  linkId?: string
  linkUrl?: string
  linkConfig?: { entryId?: string }
}): string | undefined {
  const linkedId = content.linkUrl?.match(/\/item\/(\d+)/)?.[1]
  return linkedId ?? content.linkConfig?.entryId ?? content.linkId
}

async function buildSources(snapshotDate: string) {
  const titleOverrides = JSON.parse(
    await readFile(resolve('scripts/wiki/mappings/bwiki-title-overrides.json'), 'utf8'),
  ) as BwikiTitleOverrides
  const result: Array<{
    provider: string
    entityId: string
    entityType: string
    officialTitle: string
    title: string
    url: string
    titleOverride: BwikiTitleOverride | null
  }> = []
  for (const catalogue of bwikiCatalogues) {
    const path = resolve('data-sources/kuro-wiki/raw', snapshotDate, catalogue.file)
    const envelope = JSON.parse(await readFile(path, 'utf8')) as OfficialCatalogueEnvelope
    for (const record of envelope.data?.results?.records ?? []) {
      if (!record.name) continue
      const content = record.content ?? {}
      const officialTitle = `${catalogue.prefix}/${record.name}`
      const titleOverride = titleOverrides[officialTitle] ?? null
      const title = titleOverride?.title ?? officialTitle
      result.push({
        provider: 'bwiki',
        entityId:
          officialEntryId(content) ?? createHash('sha256').update(record.name).digest('hex'),
        entityType: catalogue.entityType,
        officialTitle,
        title,
        url: `https://wiki.biligame.com/wutheringwaves/${title}`,
        titleOverride,
      })
    }
  }
  if (readFlag('include-wikiwiki-phase-one') === 'true') {
    result.push(
      ...phaseOneWikiWikiSources
        .filter((source) => source.provider === 'wikiwiki')
        .map((source) => ({ ...source, officialTitle: source.title, titleOverride: null })),
    )
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

function finalHttpStatus(headers: string): number | undefined {
  return [...headers.matchAll(/^HTTP\/\S+\s+(\d+)/gim)].map((match) => Number(match[1])).at(-1)
}

function isChallengePage(html: string): boolean {
  return /EO_Bot_Ssid|cf-error-details|访问验证|安全验证/i.test(html)
}

function bwikiApiUrl(title: string): string {
  const parameters = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    titles: title,
  })
  return `https://wiki.biligame.com/wutheringwaves/api.php?${parameters}`
}

function hasBwikiRevision(payload: string): boolean {
  try {
    const parsed = JSON.parse(payload) as {
      query?: { pages?: Array<{ missing?: boolean; revisions?: unknown[] }> }
    }
    const page = parsed.query?.pages?.[0]
    return Boolean(page && !page.missing && page.revisions?.length)
  } catch {
    return false
  }
}

function bwikiResponseTitle(payload: string): string | undefined {
  try {
    const parsed = JSON.parse(payload) as { query?: { pages?: Array<{ title?: string }> } }
    return parsed.query?.pages?.[0]?.title
  } catch {
    return undefined
  }
}

async function main() {
  const snapshotDate = readFlag('date') ?? new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) {
    throw new Error('--date must use YYYY-MM-DD')
  }
  const delayMs = positiveInteger(readFlag('delay-ms'), DEFAULT_DELAY_MS, 'delay-ms')
  const retries = positiveInteger(readFlag('retries'), DEFAULT_RETRIES, 'retries')
  const preferApi = readFlag('prefer-api') === 'true'
  const maxRequests = positiveInteger(
    readFlag('max-requests'),
    Number.MAX_SAFE_INTEGER,
    'max-requests',
  )
  const root = resolve('data-sources/community-wikis/raw', snapshotDate)
  await mkdir(root, { recursive: true })
  const sources = await buildSources(snapshotDate)

  const files = []
  const missing = []
  const legacyHtmlPending = []
  let blocked: { provider: string; url: string; reason: string } | null = null
  let stopRequests = false
  let requested = 0
  const bwikiPayloadsByTitle = new Map<string, { content: string; headers?: string }>()
  for (const [index, source] of sources.entries()) {
    const providerDirectory = resolve(root, source.provider)
    await mkdir(providerDirectory, { recursive: true })
    const htmlRelativePath = `${source.provider}/${source.entityId}.html`
    const apiRelativePath = `${source.provider}/${source.entityId}.json`
    const missingRelativePath = `${source.provider}/${source.entityId}.missing.json`
    const legacyHeadersRelativePath = `${source.provider}/${source.entityId}.headers.txt`
    const htmlHeadersRelativePath = `${source.provider}/${source.entityId}.html.headers.txt`
    const apiHeadersRelativePath = `${source.provider}/${source.entityId}.json.headers.txt`
    const htmlPath = resolve(root, htmlRelativePath)
    const apiPath = resolve(root, apiRelativePath)
    const missingPath = resolve(root, missingRelativePath)
    const cachedHtml = await readFile(htmlPath, 'utf8').catch(() => undefined)
    const cachedApi = await readFile(apiPath, 'utf8').catch(() => undefined)
    const cachedMissing = await readFile(missingPath, 'utf8').catch(() => undefined)
    if (preferApi && cachedHtml && !cachedApi && !isChallengePage(cachedHtml)) {
      legacyHtmlPending.push({
        ...source,
        path: htmlRelativePath,
        bytes: Buffer.byteLength(cachedHtml),
        sha256: createHash('sha256').update(cachedHtml).digest('hex'),
        reason: 'Rendered HTML is cached and awaits a MediaWiki revision JSON upgrade.',
      })
    }
    if (
      cachedMissing &&
      !hasBwikiRevision(cachedMissing) &&
      bwikiResponseTitle(cachedMissing) === source.title
    ) {
      missing.push({ ...source, reason: 'MediaWiki API page or revision missing' })
      continue
    }
    const cachedContent = cachedApi ?? (preferApi ? undefined : cachedHtml)
    const cachedPath = cachedApi ? apiRelativePath : htmlRelativePath
    const cachedHeadersCandidates = cachedApi
      ? [apiHeadersRelativePath, legacyHeadersRelativePath]
      : cachedHtml
        ? [htmlHeadersRelativePath, legacyHeadersRelativePath]
        : [apiHeadersRelativePath, legacyHeadersRelativePath]
    let cachedHeaders: string | undefined
    let cachedHeadersRelativePath = cachedHeadersCandidates[0]!
    for (const candidate of cachedHeadersCandidates) {
      cachedHeaders = await readFile(resolve(root, candidate), 'utf8').catch(() => undefined)
      if (cachedHeaders && finalHttpStatus(cachedHeaders) === 200) {
        cachedHeadersRelativePath = candidate
        break
      }
    }
    if (
      cachedContent &&
      !isChallengePage(cachedContent) &&
      ((cachedHtml && !preferApi) || hasBwikiRevision(cachedContent))
    ) {
      if (source.provider === 'bwiki') {
        bwikiPayloadsByTitle.set(source.title, { content: cachedContent, headers: cachedHeaders })
      }
      files.push({
        ...source,
        path: cachedPath,
        headersPath:
          cachedHeaders && finalHttpStatus(cachedHeaders) === 200
            ? cachedHeadersRelativePath
            : null,
        bytes: Buffer.byteLength(cachedContent),
        sha256: createHash('sha256').update(cachedContent).digest('hex'),
        etag: cachedHeaders ? headerValue(cachedHeaders, 'etag') : null,
        lastModified: cachedHeaders ? headerValue(cachedHeaders, 'last-modified') : null,
        reused: true,
      })
      continue
    }
    const sharedBwikiPayload =
      source.provider === 'bwiki' ? bwikiPayloadsByTitle.get(source.title) : undefined
    if (sharedBwikiPayload) {
      await writeFile(apiPath, sharedBwikiPayload.content, 'utf8')
      if (sharedBwikiPayload.headers) {
        await writeFile(resolve(root, apiHeadersRelativePath), sharedBwikiPayload.headers, 'utf8')
      }
      await unlink(missingPath).catch(() => undefined)
      files.push({
        ...source,
        path: apiRelativePath,
        headersPath: sharedBwikiPayload.headers ? apiHeadersRelativePath : null,
        bytes: Buffer.byteLength(sharedBwikiPayload.content),
        sha256: createHash('sha256').update(sharedBwikiPayload.content).digest('hex'),
        etag: sharedBwikiPayload.headers ? headerValue(sharedBwikiPayload.headers, 'etag') : null,
        lastModified: sharedBwikiPayload.headers
          ? headerValue(sharedBwikiPayload.headers, 'last-modified')
          : null,
        reused: true,
      })
      continue
    }
    if (stopRequests) {
      missing.push({ ...source, reason: 'Not requested after provider block or rate limit' })
      continue
    }
    if (requested >= maxRequests) {
      missing.push({ ...source, reason: 'Not requested after reaching --max-requests.' })
      continue
    }
    if (requested > 0) await delay(delayMs)
    requested += 1
    const usesBwikiApi = source.provider === 'bwiki'
    const requestUrl = usesBwikiApi ? bwikiApiUrl(source.title) : source.url
    const relativePath = usesBwikiApi ? apiRelativePath : htmlRelativePath
    const headersRelativePath = usesBwikiApi ? apiHeadersRelativePath : htmlHeadersRelativePath
    const outputPath = usesBwikiApi ? apiPath : htmlPath
    const headersPath = resolve(root, headersRelativePath)
    let html: string
    try {
      html = await download(requestUrl, headersPath, retries)
    } catch {
      const failedHeaders = await readFile(headersPath, 'utf8').catch(() => '')
      const status = finalHttpStatus(failedHeaders)
      await unlink(headersPath).catch(() => undefined)
      if (status && [403, 429, 567].includes(status)) {
        blocked = {
          provider: source.provider,
          url: requestUrl,
          reason: `The provider blocked or rate-limited the request with HTTP ${status}.`,
        }
        stopRequests = true
        missing.push({ ...source, reason: blocked.reason })
        continue
      }
      missing.push({ ...source, reason: 'HTTP error or page not created' })
      continue
    }
    if (isChallengePage(html)) {
      await unlink(headersPath).catch(() => undefined)
      blocked = {
        provider: source.provider,
        url: requestUrl,
        reason: 'The provider returned an automated-access challenge.',
      }
      stopRequests = true
      missing.push({ ...source, reason: blocked.reason })
      continue
    }
    if (usesBwikiApi && !hasBwikiRevision(html)) {
      await writeFile(missingPath, html, 'utf8')
      await unlink(headersPath).catch(() => undefined)
      missing.push({ ...source, reason: 'MediaWiki API page or revision missing' })
      continue
    }
    await writeFile(outputPath, html, 'utf8')
    await unlink(missingPath).catch(() => undefined)
    const headers = await readFile(headersPath, 'utf8')
    if (usesBwikiApi) bwikiPayloadsByTitle.set(source.title, { content: html, headers })
    files.push({
      ...source,
      path: relativePath,
      headersPath: headersRelativePath,
      bytes: Buffer.byteLength(html),
      sha256: createHash('sha256').update(html).digest('hex'),
      etag: headerValue(headers, 'etag'),
      lastModified: headerValue(headers, 'last-modified'),
      reused: false,
    })
    if (files.length % 10 === 0 || index + 1 === sources.length) {
      console.log(`Checked community pages: ${files.length}/${sources.length}`)
    }
  }

  const manifest = {
    schemaVersion: 1,
    snapshotDate,
    fetchedAt: new Date().toISOString(),
    scope:
      'All official resonator, weapon, echo, and sonata catalogue entities for BWiki; optional Phase 1 WikiWiki resonator',
    purpose: 'Community cross-check for names, aliases, max-level stats, and effects',
    files,
    legacyHtmlPending,
    missing,
    blocked,
    requested,
    reused: files.filter((file) => file.reused).length,
  }
  await writeFile(resolve(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`Saved community Wiki snapshot to ${root}`)
  for (const file of files) console.log(`- ${file.provider}/${file.entityId}: ${file.bytes} bytes`)
}

await main()
