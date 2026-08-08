import { describe, expect, it } from 'vitest'
import fixture from '../data-sources/kuro-wiki/fixtures/synthetic-resonator.json'
import { normalizeCandidate } from '../scripts/wiki/normalize-candidates'
import { wikiManifest } from '../src/data/wiki/loadManifest'

describe('offline Wiki candidate pipeline', () => {
  it('tracks the five calculator source catalogues', () =>
    expect(wikiManifest.catalogues.map((item) => item.key)).toEqual([
      'resonators',
      'weapons',
      'echoes',
      'sonata',
      'enemies',
    ]))
  it('normalizes a synthetic candidate without promoting it', () =>
    expect(normalizeCandidate(fixture.source)).toEqual(fixture.expected))
})
