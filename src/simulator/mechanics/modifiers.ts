import type {
  CombatModifiers,
  CombatStats,
  DamageType,
  EffectCondition,
  SimulationInput,
  TeamMemberContext,
} from '../../domain/combat'

export interface ConditionContext {
  resonatorSlotId?: string
  activeSlotId?: string
  shieldedSlotIds?: ReadonlySet<string>
}

export function conditionMatches(
  effect: { condition?: EffectCondition },
  input: SimulationInput,
  actionId: string,
  context: ConditionContext = {},
): boolean {
  const condition = effect.condition
  if (!condition) return true
  if ((condition.minResonanceChain ?? 0) > input.resonanceChain) return false
  if (condition.actionIds && !condition.actionIds.includes(actionId)) return false
  const member = input.team?.find((item) => item.slotId === context.resonatorSlotId)
  if (condition.resonatorIds && !matchesMember(condition.resonatorIds, member, 'resonatorId'))
    return false
  if (condition.weaponIds && !matchesMember(condition.weaponIds, member, 'weaponId')) return false
  if (condition.mainEchoIds && !matchesMember(condition.mainEchoIds, member, 'mainEchoId'))
    return false
  if (condition.sonataIds && !condition.sonataIds.some((id) => member?.sonataIds?.includes(id)))
    return false
  const configuredTeam = input.team?.filter((item) => item.resonatorId) ?? []
  if ((condition.minimumTeamSize ?? 0) > configuredTeam.length) return false
  if (
    condition.teamIncludesResonatorIds &&
    !condition.teamIncludesResonatorIds.every((id) =>
      configuredTeam.some((item) => item.resonatorId === id),
    )
  )
    return false
  if (
    condition.sourceIsActive !== undefined &&
    (context.resonatorSlotId === context.activeSlotId) !== condition.sourceIsActive
  )
    return false
  if (
    condition.shieldActive !== undefined &&
    Boolean(context.resonatorSlotId && context.shieldedSlotIds?.has(context.resonatorSlotId)) !==
      condition.shieldActive
  )
    return false
  return true
}

function matchesMember(
  accepted: string[],
  member: TeamMemberContext | undefined,
  key: 'resonatorId' | 'weaponId' | 'mainEchoId',
): boolean {
  const value = member?.[key]
  return Boolean(value && accepted.includes(value))
}

export function resolveModifiers(
  modifiers: CombatModifiers,
  input: SimulationInput,
): CombatModifiers {
  const refinementAttack =
    modifiers.attackPercentByWeaponRefinement?.[input.weaponRefinement - 1] ?? 0
  return {
    ...modifiers,
    attackPercent: (modifiers.attackPercent ?? 0) + refinementAttack,
    attackPercentByWeaponRefinement: undefined,
  }
}

export function sumModifiers(modifiers: CombatModifiers[]): CombatModifiers {
  const result: CombatModifiers = { damageTypeBonuses: {} }
  const scalarKeys = [
    'attackPercent',
    'healthPercent',
    'defensePercent',
    'aeroDamageBonus',
    'genericDamageBonus',
    'multiplierBonus',
    'damageDeepen',
    'independentMultiplierBonus',
    'defenseIgnore',
    'defenseReduction',
    'resistanceIgnore',
    'resistanceReduction',
  ] as const
  for (const modifier of modifiers) {
    for (const key of scalarKeys) result[key] = (result[key] ?? 0) + (modifier[key] ?? 0)
    for (const [type, value] of Object.entries(modifier.damageTypeBonuses ?? {})) {
      const damageType = type as DamageType
      result.damageTypeBonuses![damageType] =
        (result.damageTypeBonuses![damageType] ?? 0) + (value ?? 0)
    }
  }
  return result
}

export function applyModifiers(stats: CombatStats, modifiers: CombatModifiers): CombatStats {
  return {
    ...stats,
    attack: stats.attack * (1 + (modifiers.attackPercent ?? 0)),
    health: (stats.health ?? 0) * (1 + (modifiers.healthPercent ?? 0)),
    defense: (stats.defense ?? 0) * (1 + (modifiers.defensePercent ?? 0)),
    aeroDamageBonus: stats.aeroDamageBonus + (modifiers.aeroDamageBonus ?? 0),
    genericDamageBonus: stats.genericDamageBonus + (modifiers.genericDamageBonus ?? 0),
    damageTypeBonuses: {
      ...stats.damageTypeBonuses,
      ...Object.fromEntries(
        Object.keys(modifiers.damageTypeBonuses ?? {}).map((type) => [
          type,
          (stats.damageTypeBonuses[type as DamageType] ?? 0) +
            (modifiers.damageTypeBonuses?.[type as DamageType] ?? 0),
        ]),
      ),
    },
    multiplierBonus: (stats.multiplierBonus ?? 0) + (modifiers.multiplierBonus ?? 0),
    damageDeepen: (stats.damageDeepen ?? 0) + (modifiers.damageDeepen ?? 0),
    independentMultiplierBonus:
      (stats.independentMultiplierBonus ?? 0) + (modifiers.independentMultiplierBonus ?? 0),
    defenseIgnore: (stats.defenseIgnore ?? 0) + (modifiers.defenseIgnore ?? 0),
    resistanceIgnore: (stats.resistanceIgnore ?? 0) + (modifiers.resistanceIgnore ?? 0),
  }
}
