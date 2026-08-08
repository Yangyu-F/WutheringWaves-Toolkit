import manifestData from '../../../data-sources/kuro-wiki/manifest.json'
import { manifestSchema } from '../schemas/wiki'

export const wikiManifest = manifestSchema.parse(manifestData)
