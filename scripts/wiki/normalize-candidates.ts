import fixture from '../../data-sources/kuro-wiki/fixtures/synthetic-resonator.json' with { type: 'json' }

export const normalizeCandidate = (source: typeof fixture.source) => ({
  id: 'fixture-resonator',
  name: source.name.trim(),
  rarity: source.rarity,
  verificationStatus: 'candidate' as const,
})

console.log(JSON.stringify(normalizeCandidate(fixture.source), null, 2))
