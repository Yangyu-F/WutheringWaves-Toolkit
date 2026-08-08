import manifest from '../data-sources/kuro-wiki/manifest.json' with { type: 'json' }
import { manifestSchema } from '../src/data/schemas/wiki'

const result = manifestSchema.safeParse(manifest)
if (!result.success) {
  console.error(result.error.issues)
  process.exit(1)
}
console.log(`Validated ${result.data.catalogues.length} official Wiki catalogue references.`)
