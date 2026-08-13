import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pinyin } from 'pinyin-pro'

type EntityType = 'resonators' | 'weapons' | 'echoes' | 'sonatas'
type SourceName = 'kuro-wiki' | 'bwiki'

interface ExtractedValue {
  label: string
  values: string[]
}

interface ExtractedEffect {
  name: string | null
  description: string
  values: string[]
  levelValues?: ExtractedValue[]
}

interface Candidate {
  schemaVersion: 1
  verificationStatus: 'candidate'
  entityType: EntityType
  name: string
  slug: string
  source: {
    provider: SourceName
    snapshotDate: string
    entityIds: string[]
    title: string
    sha256: string
  }
  basicInfo: Record<string, unknown>
  effects: ExtractedEffect[]
  skills?: Array<ExtractedEffect & { category: string }>
  resonanceChains?: ExtractedEffect[]
  extractionNotes: string[]
}

const entityDirectories: Record<EntityType, string> = {
  resonators: 'resonators',
  weapons: 'weapons',
  echoes: 'echoes',
  sonatas: 'sonatas',
}

const communityEntityTypes: Record<string, EntityType> = {
  resonator: 'resonators',
  weapon: 'weapons',
  echo: 'echoes',
  sonata: 'sonatas',
}

function flag(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length)
}

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    nbsp: ' ',
    middot: '·',
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    '#39': "'",
  }
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/tr>|<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&([a-z]+|#39);/gi, (_, key: string) => named[key.toLowerCase()] ?? `&${key};`)
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function stripWiki(value: string): string {
  let text = value
  for (let pass = 0; pass < 4; pass += 1) {
    text = text.replace(/\{\{颜色\|[^|{}]+\|([^{}]+)}}/g, '$1')
    text = text.replace(/\{\{[^{}]+}}/g, '')
  }
  return decodeHtml(
    text
      .replace(/<!--[^]*?-->/g, '')
      .replace(/'''?/g, '')
      .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)]]/g, '$1'),
  )
}

function values(text: string): string[] {
  return [...new Set(text.match(/-?\d+(?:\.\d+)?%?(?:\s*[*+]\s*\d+(?:\.\d+)?%?)?/g) ?? [])]
}

function slug(name: string): string {
  return pinyin(name, { toneType: 'none', type: 'array', nonZh: 'consecutive' })
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function templateParameters(source: string): Record<string, string> {
  const result: Record<string, string> = {}
  let key: string | undefined
  for (const line of source.split('\n')) {
    const match = line.match(/^\|([^=]+)=(.*)$/)
    if (match) {
      key = match[1]?.trim()
      if (key && result[key] === undefined) result[key] = match[2] ?? ''
      else key = undefined
    } else if (key && !/^}}/.test(line)) {
      result[key] = `${result[key]}\n${line}`
    }
  }
  return result
}

function parseLevelValues(raw: string): ExtractedValue[] {
  return raw
    .split(';')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [label = '', ...rowValues] = row.split(',').map(stripWiki)
      return { label, values: rowValues.filter(Boolean) }
    })
}

function effect(
  name: string | null,
  description: string,
  rawValues = description,
): ExtractedEffect {
  const cleanDescription = stripWiki(description)
  return {
    name: name ? stripWiki(name) : null,
    description: cleanDescription,
    values: values(stripWiki(rawValues)),
  }
}

function refinementLevelValues(description: string): ExtractedValue[] {
  return [...description.matchAll(/\d+(?:\.\d+)?%?(?:\/\d+(?:\.\d+)?%?){4}/g)].map(
    (match, index) => ({
      label: `谐振阶参数${index + 1}`,
      values: match[0].split('/'),
    }),
  )
}

function bwikiCandidate(
  entityType: EntityType,
  title: string,
  sourceText: string,
  snapshotDate: string,
  entityIds: string[],
): Candidate | undefined {
  const parameters = templateParameters(sourceText)
  const name = stripWiki(parameters['名称'] ?? title.split('/').at(-1) ?? title)
  const rarity = Number(parameters['品质']) || null
  const cost = Number(stripWiki(parameters['COST花费'] ?? '').match(/[134]/)?.[0]) || null
  if ((entityType === 'resonators' || entityType === 'weapons') && ![4, 5].includes(rarity ?? 0)) {
    return undefined
  }
  if (entityType === 'echoes' && ![3, 4].includes(cost ?? 0)) return undefined

  const basicInfo: Candidate['basicInfo'] = { rarity, cost }
  const effects: ExtractedEffect[] = []
  const candidate: Candidate = {
    schemaVersion: 1,
    verificationStatus: 'candidate',
    entityType,
    name,
    slug: slug(name),
    source: {
      provider: 'bwiki',
      snapshotDate,
      entityIds,
      title,
      sha256: createHash('sha256').update(sourceText).digest('hex'),
    },
    basicInfo,
    effects,
    extractionNotes: [
      'MediaWiki template fields were parsed mechanically; candidate requires review.',
    ],
  }

  if (entityType === 'resonators') {
    Object.assign(basicInfo, {
      element: stripWiki(parameters['属性'] ?? ''),
      weaponType: stripWiki(parameters['武器'] ?? ''),
      level90: {
        hp: Number(parameters['90生命']) || null,
        attack: Number(parameters['90攻击']) || null,
        defense: Number(parameters['90防御']) || null,
      },
    })
    const categories = [
      '常态攻击',
      '共鸣技能',
      '共鸣回路',
      '共鸣解放',
      '变奏技能',
      '延奏技能',
      '谐度破坏',
    ]
    candidate.skills = categories
      .filter((category) => parameters[category] || parameters[`${category}描述`])
      .map((category) => ({
        category,
        ...effect(parameters[category] ?? null, parameters[`${category}描述`] ?? ''),
        levelValues: parseLevelValues(parameters[`${category}倍率`] ?? ''),
      }))
    for (const prefix of [
      '固有技能1',
      '固有技能2',
      '属性加成1',
      '属性加成2',
      '属性加成3',
      '属性加成4',
    ]) {
      if (parameters[prefix] || parameters[`${prefix}描述`]) {
        effects.push(effect(parameters[prefix] ?? null, parameters[`${prefix}描述`] ?? ''))
      }
    }
    candidate.resonanceChains = Array.from({ length: 6 }, (_, index) => index + 1)
      .filter((rank) => parameters[`共鸣链${rank}`] || parameters[`共鸣链${rank}描述`])
      .map((rank) =>
        effect(parameters[`共鸣链${rank}`] ?? null, parameters[`共鸣链${rank}描述`] ?? ''),
      )
  } else if (entityType === 'weapons') {
    Object.assign(basicInfo, {
      weaponType: stripWiki(parameters['类型'] ?? ''),
      level90Attack: null,
      secondaryStat: stripWiki(parameters['副词条'] ?? ''),
      secondaryStatInitialValue: stripWiki(parameters['词条初始数值'] ?? ''),
    })
    const description = parameters['技能描述'] ?? ''
    effects.push({
      ...effect(parameters['武器技能'] ?? null, description),
      levelValues: refinementLevelValues(stripWiki(description)),
    })
  } else if (entityType === 'echoes') {
    Object.assign(basicInfo, {
      code: stripWiki(parameters['编号'] ?? ''),
      class: stripWiki(parameters['危险度'] ?? ''),
      sonatas: stripWiki(parameters['所属套装'] ?? '')
        .split(',')
        .filter(Boolean),
      cooldownSeconds: Number(stripWiki(parameters['技能冷却'] ?? '')) || null,
      rarity: 5,
    })
    effects.push(effect('声骸技能', parameters['5星声骸技能'] ?? ''))
  } else {
    for (const setSize of [1, 2, 5]) {
      const description = parameters[`${setSize}件套效果`]
      if (description) effects.push(effect(`${setSize}件套`, description))
    }
  }
  return candidate
}

function collectOfficialComponents(
  value: unknown,
  output: Array<{ title: string; text: string }>,
): void {
  if (Array.isArray(value)) {
    for (const child of value) collectOfficialComponents(child, output)
    return
  }
  if (!value || typeof value !== 'object') return
  const object = value as Record<string, unknown>
  if (typeof object.content === 'string' && object.content.trim()) {
    output.push({
      title: typeof object.title === 'string' ? object.title : '',
      text: decodeHtml(object.content),
    })
  }
  for (const child of Object.values(object)) collectOfficialComponents(child, output)
}

function tableRows(html: string): string[][] {
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((row) =>
      [...row[1]!.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
        decodeHtml(cell[1]!),
      ),
    )
    .filter((row) => row.length)
}

function officialCandidate(
  entityType: EntityType,
  name: string,
  content: unknown,
  snapshotDate: string,
  entityId: string,
  sha256: string,
  metadata: { rarity: number | null; cost: number | null },
): Candidate | undefined {
  const components: Array<{ title: string; text: string }> = []
  collectOfficialComponents(content, components)
  const fullText = components.map((component) => component.text).join('\n')
  const resolvedMetadata = {
    rarity: entityType === 'echoes' ? 5 : metadata.rarity,
    cost:
      entityType === 'echoes'
        ? Number(fullText.match(/COST[」』】]?\s*([134])/i)?.[1]) || null
        : metadata.cost,
  }
  if (
    (entityType === 'resonators' || entityType === 'weapons') &&
    ![4, 5].includes(resolvedMetadata.rarity ?? 0)
  )
    return undefined
  if (entityType === 'echoes' && ![3, 4].includes(resolvedMetadata.cost ?? 0)) return undefined
  const effects = components
    .filter((component) => /描述|效果|技能|共鸣链/.test(component.title))
    .map((component) => effect(component.title || null, component.text))
  const candidate: Candidate = {
    schemaVersion: 1,
    verificationStatus: 'candidate',
    entityType,
    name,
    slug: slug(name),
    source: { provider: 'kuro-wiki', snapshotDate, entityIds: [entityId], title: name, sha256 },
    basicInfo: { rarity: resolvedMetadata.rarity, cost: resolvedMetadata.cost },
    effects,
    extractionNotes: [
      'Official component JSON was flattened without discarding source text; table fields require review.',
    ],
  }
  const serialized = JSON.stringify(content)
  const componentObjects: Array<Record<string, unknown>> = []
  const collectObjects = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(collectObjects)
    if (!value || typeof value !== 'object') return
    const object = value as Record<string, unknown>
    if (object.title || object.tabs) componentObjects.push(object)
    Object.values(object).forEach(collectObjects)
  }
  collectObjects(content)
  const basicComponent = componentObjects.find((item) => item.title === '基础信息')
  if (typeof basicComponent?.content === 'string') {
    for (const row of tableRows(basicComponent.content)) {
      if (row.length === 2 && row[0]) candidate.basicInfo[row[0]] = row[1] ?? ''
    }
  }
  if (entityType === 'resonators') {
    const role = serialized.match(/"role":\{([\s\S]*?)},"size"/)?.[1]
    const stats = componentObjects.find((item) => item.title === '角色统计')
    const level90 = Array.isArray(stats?.tabs)
      ? (stats.tabs as Array<{ title?: string; content?: string }>).find(
          (tab) => tab.title === '90',
        )
      : undefined
    Object.assign(candidate.basicInfo, {
      roleSummary: role ? decodeHtml(role) : null,
      level90: level90?.content ? tableRows(level90.content) : [],
    })
    const skills = componentObjects.find((item) => item.title === '技能介绍')
    candidate.skills = Array.isArray(skills?.tabs)
      ? (skills.tabs as Array<{ title?: string; content?: string }>).map((tab) => {
          const text = decodeHtml(tab.content ?? '')
          return {
            category: tab.title ?? '',
            ...effect(text.split('\n')[0] ?? null, text),
            levelValues: tableRows(tab.content ?? '').map((row) => ({
              label: row[0] ?? '',
              values: row.slice(1),
            })),
          }
        })
      : []
    const chain = componentObjects.find((item) => item.title === '共鸣链')
    candidate.resonanceChains =
      typeof chain?.content === 'string'
        ? tableRows(chain.content)
            .slice(1)
            .map((row) => effect(row[0] ?? null, row.slice(1).join(' ')))
        : []
  } else if (entityType === 'weapons') {
    const description = componentObjects.find((item) => item.title === '武器描述')
    if (typeof description?.content === 'string') {
      const text = decodeHtml(description.content)
      candidate.effects = [
        {
          ...effect(text.split('\n')[0] ?? null, text),
          levelValues: refinementLevelValues(text),
        },
      ]
    }
    const levelComponent = componentObjects.find(
      (item) =>
        Array.isArray(item.tabs) &&
        (item.tabs as Array<{ title?: string }>).some((tab) => tab.title === '90级'),
    )
    const level90 = Array.isArray(levelComponent?.tabs)
      ? (levelComponent.tabs as Array<{ title?: string; content?: string }>).find(
          (tab) => tab.title === '90级',
        )
      : undefined
    if (level90?.content) candidate.basicInfo.level90 = decodeHtml(level90.content)
  }
  return candidate
}

async function writeCandidate(root: string, candidate: Candidate): Promise<string> {
  const directory = resolve(root, entityDirectories[candidate.entityType])
  await mkdir(directory, { recursive: true })
  const path = `${entityDirectories[candidate.entityType]}/${candidate.slug}-${candidate.source.provider}.json`
  await writeFile(resolve(root, path), `${JSON.stringify(candidate, null, 2)}\n`, 'utf8')
  return path
}

async function main() {
  const snapshotDate = flag('date') ?? '2026-08-10'
  const gameVersion = flag('game-version') ?? '3.5'
  const versionScopes = JSON.parse(
    await readFile(resolve('scripts/wiki/mappings/game-version-scope.json'), 'utf8'),
  ) as Record<string, { excluded: Record<EntityType, string[]>; reason: string }>
  const versionScope = versionScopes[gameVersion]
  if (!versionScope) throw new Error(`No candidate extraction scope is defined for ${gameVersion}.`)
  const isOutsideVersion = (entityType: EntityType, name: string) =>
    versionScope.excluded[entityType].includes(name)
  const outputRoot = resolve('data-sources/extracted/candidates', snapshotDate)
  await rm(outputRoot, { recursive: true, force: true })
  const entries: Array<{ name: string; entityType: EntityType; source: SourceName; path: string }> =
    []
  const skipped: Array<{
    name: string
    entityType: EntityType
    source: SourceName
    reason: string
  }> = []

  const officialRoot = resolve('data-sources/kuro-wiki/raw', snapshotDate)
  const officialManifest = JSON.parse(
    await readFile(resolve(officialRoot, 'manifest.json'), 'utf8'),
  ) as {
    entryBodies: {
      entries: Array<{
        entityName: string
        entityType: EntityType
        entryId: string
        path: string
        sha256: string
      }>
    }
  }
  const catalogueMetadata = new Map<string, { rarity: number | null; cost: number | null }>()
  for (const entityType of Object.keys(entityDirectories) as EntityType[]) {
    const envelope = JSON.parse(
      await readFile(resolve(officialRoot, `${entityType}.json`), 'utf8'),
    ) as {
      data?: {
        results?: {
          records?: Array<{
            name?: string
            content?: {
              star?: string
              level?: string
              linkId?: string
              linkUrl?: string
              linkConfig?: { entryId?: string }
            }
          }>
        }
      }
    }
    for (const record of envelope.data?.results?.records ?? []) {
      const id =
        record.content?.linkUrl?.match(/\/item\/(\d+)/)?.[1] ||
        record.content?.linkConfig?.entryId ||
        record.content?.linkId
      if (id)
        catalogueMetadata.set(id, {
          rarity: Number(record.content?.star) || null,
          cost: Number(record.content?.level) || null,
        })
    }
  }
  for (const entry of officialManifest.entryBodies.entries) {
    const envelope = JSON.parse(await readFile(resolve(officialRoot, entry.path), 'utf8')) as {
      data?: { name?: string; content?: unknown }
    }
    const name = (entry.entityName || envelope.data?.name || entry.entryId).trim()
    if (isOutsideVersion(entry.entityType, name)) {
      skipped.push({
        name,
        entityType: entry.entityType,
        source: 'kuro-wiki',
        reason: `Outside Version ${gameVersion} scope.`,
      })
      continue
    }
    const candidate = officialCandidate(
      entry.entityType,
      name,
      envelope.data?.content,
      snapshotDate,
      entry.entryId,
      entry.sha256,
      catalogueMetadata.get(entry.entryId) ?? { rarity: null, cost: null },
    )
    if (!candidate)
      skipped.push({
        name,
        entityType: entry.entityType,
        source: 'kuro-wiki',
        reason: 'Filtered by rarity or COST.',
      })
    else
      entries.push({
        name,
        entityType: entry.entityType,
        source: 'kuro-wiki',
        path: await writeCandidate(outputRoot, candidate),
      })
  }

  const communityRoot = resolve('data-sources/community-wikis/raw', snapshotDate)
  const communityManifest = JSON.parse(
    await readFile(resolve(communityRoot, 'manifest.json'), 'utf8'),
  ) as {
    files: Array<{ entityId: string; entityType: string; title: string; path: string }>
    legacyHtmlPending?: Array<{
      entityId: string
      entityType: string
      title: string
      path: string
    }>
  }
  const communityFiles = [
    ...communityManifest.files,
    ...(communityManifest.legacyHtmlPending ?? []),
  ]
  const grouped = new Map<string, typeof communityManifest.files>()
  for (const file of communityFiles) {
    const key = `${file.entityType}:${file.title}`
    grouped.set(key, [...(grouped.get(key) ?? []), file])
  }
  for (const files of grouped.values()) {
    const first = files.find((file) => file.path.endsWith('.json'))
    const manifestEntry = files[0]!
    const entityType = communityEntityTypes[manifestEntry.entityType]
    if (!entityType) continue
    if (!first) {
      skipped.push({
        name: manifestEntry.title.split('/').at(-1) ?? manifestEntry.title,
        entityType,
        source: 'bwiki',
        reason: 'Only rendered HTML is cached; a MediaWiki revision payload is required.',
      })
      continue
    }
    const payload = JSON.parse(await readFile(resolve(communityRoot, first.path), 'utf8')) as {
      query?: { pages?: Array<{ revisions?: Array<{ slots?: { main?: { content?: string } } }> }> }
    }
    const sourceText = payload.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content ?? ''
    const candidate = bwikiCandidate(
      entityType,
      first.title,
      sourceText,
      snapshotDate,
      files.map((file) => file.entityId),
    )
    const name = stripWiki(
      templateParameters(sourceText)['名称'] ?? first.title.split('/').at(-1) ?? first.title,
    )
    if (isOutsideVersion(entityType, name)) {
      skipped.push({
        name,
        entityType,
        source: 'bwiki',
        reason: `Outside Version ${gameVersion} scope.`,
      })
      continue
    }
    if (!candidate)
      skipped.push({ name, entityType, source: 'bwiki', reason: 'Filtered by rarity or COST.' })
    else
      entries.push({
        name,
        entityType,
        source: 'bwiki',
        path: await writeCandidate(outputRoot, candidate),
      })
  }

  await mkdir(outputRoot, { recursive: true })
  await writeFile(
    resolve(outputRoot, 'index.json'),
    `${JSON.stringify({ schemaVersion: 1, snapshotDate, gameVersion, entries, skipped }, null, 2)}\n`,
    'utf8',
  )
  console.log(`Extracted ${entries.length} candidates; skipped ${skipped.length}.`)
}

await main()
