import type { CombatStats, CriticalMode, DamageBreakdown, DamageType } from '../../domain/combat'

export const resistanceFormulaVerification = {
  negative: 'cross-checked',
  standard: 'cross-checked',
  high: 'community-consensus',
} as const

export function getDefenseMultiplier(
  resonatorLevel: number,
  enemyLevel: number,
  defenseIgnore = 0,
  defenseReduction = 0,
): number {
  const attackerDefenseTerm = 100 + resonatorLevel
  const effectiveDefenseFactor = 1 - Math.min(1, Math.max(0, defenseIgnore + defenseReduction))
  const enemyDefenseTerm = (99 + enemyLevel) * effectiveDefenseFactor
  return attackerDefenseTerm / (attackerDefenseTerm + enemyDefenseTerm)
}

export function getResistanceMultiplier(resistance: number): number {
  if (resistance < 0) return 1 - resistance / 2
  if (resistance < 0.8) return 1 - resistance
  return 1 / (1 + resistance * 5)
}

export function getCriticalMultiplier(stats: CombatStats, mode: CriticalMode): number {
  if (mode === 'critical') return stats.criticalDamageMultiplier
  if (mode === 'normal') return 1
  const criticalRate = Math.min(1, Math.max(0, stats.criticalRate))
  return 1 + criticalRate * (stats.criticalDamageMultiplier - 1)
}

export interface CalculateDamageInput {
  resonatorLevel: number
  enemyLevel: number
  resistance: number
  stats: CombatStats
  damageType: DamageType
  multiplier: number
  criticalMode: CriticalMode
  defenseReduction?: number
  resistanceReduction?: number
}

export function calculateDamage(input: CalculateDamageInput): DamageBreakdown {
  const multiplierBonusMultiplier = 1 + (input.stats.multiplierBonus ?? 0)
  const rawDamage = input.stats.attack * input.multiplier * multiplierBonusMultiplier
  const damageBonusMultiplier =
    1 +
    input.stats.aeroDamageBonus +
    input.stats.genericDamageBonus +
    (input.stats.damageTypeBonuses[input.damageType] ?? 0)
  const criticalMultiplier = getCriticalMultiplier(input.stats, input.criticalMode)
  const damageDeepenMultiplier = 1 + (input.stats.damageDeepen ?? 0)
  const independentMultiplier = 1 + (input.stats.independentMultiplierBonus ?? 0)
  const defenseMultiplier = getDefenseMultiplier(
    input.resonatorLevel,
    input.enemyLevel,
    input.stats.defenseIgnore,
    input.defenseReduction,
  )
  const effectiveResistance =
    input.resistance - (input.stats.resistanceIgnore ?? 0) - (input.resistanceReduction ?? 0)
  const resistanceMultiplier = getResistanceMultiplier(effectiveResistance)
  const finalDamage =
    rawDamage *
    damageBonusMultiplier *
    damageDeepenMultiplier *
    independentMultiplier *
    criticalMultiplier *
    defenseMultiplier *
    resistanceMultiplier

  return {
    scalingBase: input.stats.attack,
    skillMultiplier: input.multiplier,
    rawDamage,
    multiplierBonusMultiplier,
    damageBonusMultiplier,
    damageDeepenMultiplier,
    independentMultiplier,
    criticalMultiplier,
    defenseMultiplier,
    resistanceMultiplier,
    effectiveResistance,
    finalDamage,
  }
}
