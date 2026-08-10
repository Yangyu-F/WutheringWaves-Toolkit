import { describe, expect, it } from 'vitest'
import golden from './fixtures/yangyang-basic-v3.5.json'
import { yangyangActions } from '../src/data/versions/v3_5/phaseOne'
import type { SimulationInput } from '../src/domain/combat'
import { simulateDamage } from '../src/simulator/simulate'

describe('Yangyang Phase 1 golden calculation', () => {
  it('calculates a four-stage basic sequence deterministically', () => {
    const result = simulateDamage(golden.input as SimulationInput, yangyangActions)

    expect(result.hits).toHaveLength(7)
    result.hits.forEach((hit, index) =>
      expect(hit.breakdown.finalDamage).toBeCloseTo(golden.expected.hitDamage[index]!, 9),
    )
    expect(result.totalDamage).toBeCloseTo(golden.expected.totalDamage, 9)
    expect(result.durationMs).toBe(golden.expected.durationMs)
    expect(result.dps).toBeCloseTo(golden.expected.dps, 9)
  })

  it('applies weapon rank, chain and post-Echo buffs in timestamp order', () => {
    const makeResult = (resonanceChain: 0 | 3, weaponRefinement: 1 | 5) =>
      simulateDamage(
        {
          resonatorLevel: 90,
          resonanceChain,
          weaponRefinement,
          criticalMode: 'normal',
          enemy: { level: 90, resistances: { aero: 0.1 } },
          stats: {
            attack: 1000,
            criticalRate: 0,
            criticalDamageMultiplier: 1.5,
            aeroDamageBonus: 0,
            genericDamageBonus: 0,
            damageTypeBonuses: {},
          },
          actions: [
            { id: 'echo', actionId: 'shenghai-jineng-feilian-zhixing', startTimeMs: 0 },
            { id: 'skill-1', actionId: 'liufeng-zaiyu', startTimeMs: 100 },
            { id: 'skill-2', actionId: 'liufeng-zaiyu', startTimeMs: 200 },
          ],
        },
        yangyangActions,
      )
    expect(makeResult(3, 5).totalDamage).toBeGreaterThan(makeResult(0, 1).totalDamage)
  })

  it('models explicit immunity separately from ordinary 100% resistance', () => {
    const baseInput = {
      resonatorLevel: 90 as const,
      resonanceChain: 0 as const,
      weaponRefinement: 1 as const,
      criticalMode: 'normal' as const,
      stats: {
        attack: 1000,
        criticalRate: 0,
        criticalDamageMultiplier: 1.5,
        aeroDamageBonus: 0,
        genericDamageBonus: 0,
        damageTypeBonuses: {},
      },
      actions: [{ id: 'hit', actionId: 'changtai-gongji-1', startTimeMs: 0 }],
    }
    const resistant = simulateDamage(
      { ...baseInput, enemy: { level: 90, resistances: { aero: 1 } } },
      yangyangActions,
    )
    const immune = simulateDamage(
      {
        ...baseInput,
        enemy: { level: 90, resistances: { aero: 1 }, immuneElements: ['aero'] },
      },
      yangyangActions,
    )

    expect(resistant.totalDamage).toBeGreaterThan(0)
    expect(immune.totalDamage).toBe(0)
    expect(immune.hits[0]?.breakdown.resistanceMultiplier).toBe(0)
  })
})
