import { describe, expect, it } from 'vitest'
import { yangyangActions } from '../src/data/versions/v3_5/phaseOne'
import type { SimulationInput } from '../src/domain/combat'
import { simulateDamage } from '../src/simulator/simulate'

const baseInput: Omit<SimulationInput, 'actions'> = {
  resonatorLevel: 90,
  resonanceChain: 0,
  weaponRefinement: 1,
  criticalMode: 'normal',
  enemy: { level: 90, resistances: { aero: 0 } },
  stats: {
    attack: 1000,
    criticalRate: 0,
    criticalDamageMultiplier: 1.5,
    aeroDamageBonus: 0,
    genericDamageBonus: 0,
    damageTypeBonuses: {},
  },
}

describe('declarative Phase 1 effects', () => {
  it('stacks the weapon effect twice, includes the exact expiry timestamp, then expires', () => {
    const result = simulateDamage(
      {
        ...baseInput,
        actions: [
          { id: 'skill-1', actionId: 'liufeng-zaiyu', startTimeMs: 0 },
          { id: 'skill-2', actionId: 'liufeng-zaiyu', startTimeMs: 100 },
          { id: 'inside', actionId: 'changtai-gongji-1', startTimeMs: 10_100 },
          { id: 'outside', actionId: 'changtai-gongji-1', startTimeMs: 10_101 },
        ],
      },
      yangyangActions,
    )
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'skill-1')?.breakdown.scalingBase,
    ).toBe(1060)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'skill-2')?.breakdown.scalingBase,
    ).toBe(1120)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'inside')?.breakdown.scalingBase,
    ).toBe(1120)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'outside')?.breakdown.scalingBase,
    ).toBe(1000)
  })

  it('applies Feilian Beringal only after its follow-up hit', () => {
    const result = simulateDamage(
      {
        ...baseInput,
        actions: [
          { id: 'echo', actionId: 'shenghai-jineng-feilian-zhixing', startTimeMs: 0 },
          { id: 'inside', actionId: 'zhongji', startTimeMs: 2 },
          { id: 'outside', actionId: 'zhongji', startTimeMs: 15_002 },
        ],
      },
      yangyangActions,
    )
    const echoHits = result.hits.filter((hit) => hit.actionInstanceId === 'echo')
    expect(echoHits.every((hit) => hit.breakdown.damageBonusMultiplier === 1)).toBe(true)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'inside')?.breakdown.damageBonusMultiplier,
    ).toBeCloseTo(1.24, 12)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'outside')?.breakdown
        .damageBonusMultiplier,
    ).toBe(1)
  })

  it('applies intro buffs after the final intro hit with independent durations', () => {
    const result = simulateDamage(
      {
        ...baseInput,
        resonanceChain: 1,
        actions: [
          { id: 'bianzou', actionId: 'zhanlan-lizan', startTimeMs: 0 },
          { id: 'all', actionId: 'changtai-gongji-1', startTimeMs: 2 },
          { id: 'sonata-only', actionId: 'changtai-gongji-1', startTimeMs: 8_002 },
          { id: 'expired', actionId: 'changtai-gongji-1', startTimeMs: 15_002 },
        ],
      },
      yangyangActions,
    )
    expect(
      result.hits
        .filter((hit) => hit.actionInstanceId === 'bianzou')
        .every((hit) => hit.breakdown.damageBonusMultiplier === 1),
    ).toBe(true)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'all')?.breakdown.damageBonusMultiplier,
    ).toBeCloseTo(1.53, 12)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'sonata-only')?.breakdown
        .damageBonusMultiplier,
    ).toBeCloseTo(1.3, 12)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'expired')?.breakdown
        .damageBonusMultiplier,
    ).toBe(1)
  })
})
