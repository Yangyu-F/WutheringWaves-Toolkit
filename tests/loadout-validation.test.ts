import { describe, expect, it } from 'vitest'
import { defaultPhaseOneLoadout } from '../src/data/versions/v3_5/phaseOne'
import { validatePhaseOneLoadout } from '../src/domain/loadout'

describe('Phase 1 Echo loadout', () => {
  it('accepts one named main Echo and four stat-only slots within 12 COST', () => {
    expect(validatePhaseOneLoadout(defaultPhaseOneLoadout)).toEqual([])
  })

  it('reports a COST overflow', () => {
    const loadout = structuredClone(defaultPhaseOneLoadout)
    loadout.secondaryEchoes.forEach((slot) => (slot.cost = 4))
    expect(validatePhaseOneLoadout(loadout)).toContainEqual({ code: 'echo-cost', actual: 20 })
  })

  it('enforces fixed five-star +25 main-stat values', () => {
    const loadout = structuredClone(defaultPhaseOneLoadout)
    loadout.mainEcho.mainStat.value = 21
    expect(validatePhaseOneLoadout(loadout)).toContainEqual({
      code: 'echo-main-value',
      actual: 21,
      slotId: 'echo-slot-1',
    })
  })

  it('rejects duplicate or non-tier substats while allowing empty rows', () => {
    const loadout = structuredClone(defaultPhaseOneLoadout)
    loadout.mainEcho.subStats = [
      { stat: 'criticalRate', value: 6.3 },
      { stat: 'criticalRate', value: 7.5 },
      { stat: 'attackPercent', value: 7 },
      { stat: 'attackFlat', value: 0 },
    ]
    const diagnostics = validatePhaseOneLoadout(loadout)
    expect(diagnostics).toContainEqual({ code: 'echo-substat-duplicate', slotId: 'echo-slot-1' })
    expect(diagnostics).toContainEqual({
      code: 'echo-substat-value',
      actual: 7,
      slotId: 'echo-slot-1',
    })
  })
})
