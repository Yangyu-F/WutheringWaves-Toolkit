import type {
  ActionShieldDefinition,
  CombatStats,
  HealingTarget,
  ShieldResult,
} from '../../domain/combat'

export function calculateShield(
  definition: ActionShieldDefinition,
  stats: CombatStats,
  sourceActionId: string,
  actionInstanceId: string,
  resonatorSlotId: string,
  targetSlotId: string | undefined,
  timeMs: number,
): ShieldResult {
  const scalingBase = definition.scalingStat === 'flat' ? 0 : (stats[definition.scalingStat] ?? 0)
  const flatValue = definition.flatValue ?? 0
  return {
    id: definition.id,
    sourceActionId,
    actionInstanceId,
    resonatorSlotId,
    target: definition.target as HealingTarget,
    targetSlotId,
    timeMs,
    endTimeMs: timeMs + definition.durationMs,
    scalingStat: definition.scalingStat,
    scalingBase,
    multiplier: definition.multiplier,
    flatValue,
    finalShield: scalingBase * definition.multiplier + flatValue,
  }
}
