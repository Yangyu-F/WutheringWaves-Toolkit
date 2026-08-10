import { describe, expect, it } from 'vitest'
import {
  calculateDamage,
  getDefenseMultiplier,
  getResistanceMultiplier,
} from '../src/simulator/calculation/damage'

describe('damage formula factors', () => {
  it('uses the level-based defense factor', () => {
    expect(getDefenseMultiplier(90, 90)).toBeCloseTo(190 / 379, 12)
  })

  it('handles the three resistance ranges', () => {
    expect(getResistanceMultiplier(-0.2)).toBeCloseTo(1.1, 12)
    expect(getResistanceMultiplier(0.1)).toBeCloseTo(0.9, 12)
    expect(getResistanceMultiplier(0.799)).toBeCloseTo(0.201, 12)
    expect(getResistanceMultiplier(0.8)).toBeCloseTo(0.2, 12)
    expect(getResistanceMultiplier(0.9)).toBeCloseTo(1 / 5.5, 12)
    expect(getResistanceMultiplier(1)).toBeCloseTo(1 / 6, 12)
  })

  it('keeps every factor in the explainable breakdown', () => {
    const result = calculateDamage({
      resonatorLevel: 90,
      enemyLevel: 90,
      resistance: 0.1,
      multiplier: 0.225,
      damageType: 'basic',
      criticalMode: 'expected',
      stats: {
        attack: 1800,
        criticalRate: 0.293,
        criticalDamageMultiplier: 1.5,
        aeroDamageBonus: 0.1,
        genericDamageBonus: 0,
        damageTypeBonuses: {},
      },
    })

    expect(result.rawDamage).toBe(405)
    expect(result.damageBonusMultiplier).toBeCloseTo(1.1, 12)
    expect(result.criticalMultiplier).toBeCloseTo(1.1465, 12)
    expect(result.finalDamage).toBeCloseTo(230.451, 3)
  })

  it('separates multiplier, deepen, independent, defense and resistance modifiers', () => {
    const result = calculateDamage({
      resonatorLevel: 90,
      enemyLevel: 90,
      resistance: 0.3,
      resistanceReduction: 0.1,
      defenseReduction: 0.1,
      multiplier: 0.5,
      damageType: 'skill',
      criticalMode: 'normal',
      stats: {
        attack: 1000,
        criticalRate: 0,
        criticalDamageMultiplier: 1.5,
        aeroDamageBonus: 0.1,
        genericDamageBonus: 0,
        damageTypeBonuses: {},
        multiplierBonus: 0.2,
        damageDeepen: 0.25,
        independentMultiplierBonus: 0.1,
        defenseIgnore: 0.2,
        resistanceIgnore: 0.05,
      },
    })

    expect(result.rawDamage).toBeCloseTo(600, 12)
    expect(result.multiplierBonusMultiplier).toBe(1.2)
    expect(result.damageDeepenMultiplier).toBe(1.25)
    expect(result.independentMultiplier).toBe(1.1)
    expect(result.defenseMultiplier).toBeCloseTo(190 / (190 + 189 * 0.7), 12)
    expect(result.effectiveResistance).toBeCloseTo(0.15, 12)
    expect(result.resistanceMultiplier).toBeCloseTo(0.85, 12)
  })
})
