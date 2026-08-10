export type EchoCost = 1 | 3 | 4
export type EchoStatKey =
  | 'hpFlat'
  | 'hpPercent'
  | 'attackFlat'
  | 'attackPercent'
  | 'defenseFlat'
  | 'defensePercent'
  | 'criticalRate'
  | 'criticalDamage'
  | 'energyRegen'
  | 'healingBonus'
  | 'aeroDamageBonus'
  | 'basicDamageBonus'
  | 'heavyDamageBonus'
  | 'skillDamageBonus'
  | 'liberationDamageBonus'

export interface EchoStatRoll {
  stat: EchoStatKey
  value: number
}

export interface EchoStatSlot {
  id: string
  cost: EchoCost
  mainStat: EchoStatRoll
  subStats: EchoStatRoll[]
}

export interface PhaseOneLoadout {
  gameVersion: '3.5'
  resonatorId: 'yangyang'
  weaponId: 'qiangu-fuliu'
  mainEchoId: 'feilian-zhixing'
  sonataId: 'xiaogu-changfeng'
  mainEcho: EchoStatSlot
  secondaryEchoes: [EchoStatSlot, EchoStatSlot, EchoStatSlot, EchoStatSlot]
}

export interface LoadoutDiagnostic {
  code:
    | 'echo-count'
    | 'echo-cost'
    | 'echo-substat-count'
    | 'main-echo-cost'
    | 'echo-main-stat'
    | 'echo-main-value'
    | 'echo-substat-type'
    | 'echo-substat-value'
    | 'echo-substat-duplicate'
  actual?: number
  slotId?: string
}

export const echoMainStatValues: Record<EchoCost, Partial<Record<EchoStatKey, number>>> = {
  4: {
    hpPercent: 33,
    attackPercent: 33,
    defensePercent: 41.5,
    criticalRate: 22,
    criticalDamage: 44,
    healingBonus: 26.4,
  },
  3: {
    hpPercent: 30,
    attackPercent: 30,
    defensePercent: 38,
    energyRegen: 32,
    aeroDamageBonus: 30,
  },
  1: { hpPercent: 22.8, attackPercent: 18, defensePercent: 18 },
}

export const echoFixedMainStats: Record<EchoCost, EchoStatRoll> = {
  4: { stat: 'attackFlat', value: 150 },
  3: { stat: 'attackFlat', value: 100 },
  1: { stat: 'hpFlat', value: 2280 },
}

export const echoSubStatValues: Partial<Record<EchoStatKey, readonly number[]>> = {
  hpFlat: [320, 360, 390, 430, 470, 510, 540, 580],
  hpPercent: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
  attackFlat: [30, 40, 50, 60],
  attackPercent: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
  defenseFlat: [40, 50, 60, 70],
  defensePercent: [8.1, 9, 10, 10.9, 11.8, 12.8, 13.8, 14.7],
  criticalRate: [6.3, 6.9, 7.5, 8.1, 8.7, 9.3, 9.9, 10.5],
  criticalDamage: [12.6, 13.8, 15, 16.2, 17.4, 18.6, 19.8, 21],
  energyRegen: [6.8, 7.6, 8.4, 9.2, 10, 10.8, 11.6, 12.4],
  basicDamageBonus: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
  heavyDamageBonus: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
  skillDamageBonus: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
  liberationDamageBonus: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
}

export function getEchoMainStatValue(cost: EchoCost, stat: EchoStatKey): number | undefined {
  return echoMainStatValues[cost][stat]
}

function includesValue(values: readonly number[], value: number): boolean {
  return values.some((allowed) => Math.abs(allowed - value) < 0.0001)
}

export function validatePhaseOneLoadout(loadout: PhaseOneLoadout): LoadoutDiagnostic[] {
  const diagnostics: LoadoutDiagnostic[] = []
  if (loadout.secondaryEchoes.length !== 4) {
    diagnostics.push({ code: 'echo-count', actual: loadout.secondaryEchoes.length })
  }
  const allEchoes = [loadout.mainEcho, ...loadout.secondaryEchoes]
  if (loadout.mainEcho.cost !== 4)
    diagnostics.push({ code: 'main-echo-cost', actual: loadout.mainEcho.cost })
  if (allEchoes.some((slot) => slot.subStats.length > 5)) {
    diagnostics.push({ code: 'echo-substat-count' })
  }
  for (const slot of allEchoes) {
    const mainValue = getEchoMainStatValue(slot.cost, slot.mainStat.stat)
    if (mainValue === undefined) diagnostics.push({ code: 'echo-main-stat', slotId: slot.id })
    else if (Math.abs(mainValue - slot.mainStat.value) >= 0.0001) {
      diagnostics.push({ code: 'echo-main-value', actual: slot.mainStat.value, slotId: slot.id })
    }
    const populatedSubStats = slot.subStats.filter((stat) => stat.value !== 0)
    const seen = new Set<EchoStatKey>()
    for (const subStat of populatedSubStats) {
      const allowed = echoSubStatValues[subStat.stat]
      if (!allowed) diagnostics.push({ code: 'echo-substat-type', slotId: slot.id })
      else if (!includesValue(allowed, subStat.value)) {
        diagnostics.push({ code: 'echo-substat-value', actual: subStat.value, slotId: slot.id })
      }
      if (seen.has(subStat.stat))
        diagnostics.push({ code: 'echo-substat-duplicate', slotId: slot.id })
      seen.add(subStat.stat)
    }
  }
  const totalCost = allEchoes.reduce((sum, echoSlot) => sum + echoSlot.cost, 0)
  if (totalCost > 12) {
    diagnostics.push({ code: 'echo-cost', actual: totalCost })
  }
  return diagnostics
}
