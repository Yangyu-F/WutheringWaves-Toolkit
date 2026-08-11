import type {
  ActionDefinition,
  CombatModifiers,
  CombatStats,
  ConditionalCombatModifiers,
  DamageType,
  SimulationInput,
  SimulationResult,
} from '../domain/combat'
import { calculateDamage } from './calculation/damage'
import { compileTimeline } from './compiler/compileActions'

interface ActiveBuff {
  definitionId: string
  expiresAt: number
  stacks: number
  maxStacks: number
  modifiers: CombatModifiers
  targetTrack: SimulationResult['buffIntervals'][number]['targetTrack']
}

function conditionMatches(
  effect: ConditionalCombatModifiers,
  input: SimulationInput,
  actionId: string,
): boolean {
  const condition = effect.condition
  if (!condition) return true
  if ((condition.minResonanceChain ?? 0) > input.resonanceChain) return false
  return !condition.actionIds || condition.actionIds.includes(actionId)
}

function resolveModifiers(modifiers: CombatModifiers, input: SimulationInput): CombatModifiers {
  const refinementAttack =
    modifiers.attackPercentByWeaponRefinement?.[input.weaponRefinement - 1] ?? 0
  return {
    ...modifiers,
    attackPercent: (modifiers.attackPercent ?? 0) + refinementAttack,
    attackPercentByWeaponRefinement: undefined,
  }
}

function sumModifiers(modifiers: CombatModifiers[]): CombatModifiers {
  const result: CombatModifiers = { damageTypeBonuses: {} }
  const scalarKeys = [
    'attackPercent',
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

function applyModifiers(stats: CombatStats, modifiers: CombatModifiers): CombatStats {
  return {
    ...stats,
    attack: stats.attack * (1 + (modifiers.attackPercent ?? 0)),
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

export function simulateDamage(
  input: SimulationInput,
  actionDefinitions: ActionDefinition[],
): SimulationResult {
  const definitions = new Map(actionDefinitions.map((action) => [action.id, action]))
  const timeline = compileTimeline(input.actions, actionDefinitions)
  const unknown = timeline.diagnostics.find((diagnostic) => diagnostic.code === 'unknown-action')
  if (unknown) {
    const action = input.actions.find((item) => item.id === unknown.actionInstanceIds[0])
    throw new Error(`Unknown action: ${action?.actionId ?? unknown.actionInstanceIds[0]}`)
  }
  const activeBuffs = new Map<string, ActiveBuff>()
  const buffIntervals: SimulationResult['buffIntervals'] = []

  const applyEffects = (
    definition: ActionDefinition,
    resonatorSlotId: string,
    trigger: 'action-start' | 'hit-after',
    timeMs: number,
    hitId?: string,
  ) => {
    for (const effect of definition.effects ?? []) {
      if (effect.trigger !== trigger || (effect.hitId && !hitId?.endsWith(`:${effect.hitId}`)))
        continue
      if (!conditionMatches(effect, input, definition.id)) continue
      const targetTrack =
        effect.target === 'team' || effect.target === 'enemy'
          ? effect.target
          : (resonatorSlotId as 'slot-1' | 'slot-2' | 'slot-3')
      const activeBuffKey = `${effect.id}:${targetTrack}`
      const existing = activeBuffs.get(activeBuffKey)
      activeBuffs.set(activeBuffKey, {
        definitionId: effect.id,
        expiresAt: timeMs + effect.durationMs,
        stacks: Math.min(effect.maxStacks ?? 1, (existing?.stacks ?? 0) + 1),
        maxStacks: effect.maxStacks ?? 1,
        modifiers: resolveModifiers(effect.modifiers, input),
        targetTrack,
      })
      buffIntervals.push({
        id: effect.id,
        sourceActionId: definition.id,
        targetTrack,
        startTimeMs: timeMs,
        endTimeMs: timeMs + effect.durationMs,
        stacks: Math.min(effect.maxStacks ?? 1, (existing?.stacks ?? 0) + 1),
      })
    }
  }

  const timestamps = [
    ...new Set([...timeline.starts, ...timeline.hits].map((event) => event.timeMs)),
  ].sort((left, right) => left - right)
  const hits: SimulationResult['hits'] = []

  for (const timeMs of timestamps) {
    for (const [id, buff] of activeBuffs) if (timeMs > buff.expiresAt) activeBuffs.delete(id)

    for (const start of timeline.starts.filter((event) => event.timeMs === timeMs)) {
      const definition = definitions.get(start.actionId)
      if (!definition) throw new Error(`Unknown action: ${start.actionId}`)
      applyEffects(definition, start.resonatorSlotId, 'action-start', timeMs)
    }

    const timestampHits = timeline.hits.filter((hit) => hit.timeMs === timeMs)
    for (const hit of timestampHits) {
      const definition = definitions.get(hit.actionId)
      if (!definition) throw new Error(`Unknown action: ${hit.actionId}`)
      const passive = (definition.passiveModifiers ?? [])
        .filter((effect) => conditionMatches(effect, input, definition.id))
        .map((effect) => resolveModifiers(effect.modifiers, input))
      const activeSnapshot = [...activeBuffs.values()]
        .filter(
          (buff) =>
            buff.targetTrack === 'team' ||
            buff.targetTrack === 'enemy' ||
            buff.targetTrack === hit.resonatorSlotId,
        )
        .flatMap((buff) => Array.from({ length: buff.stacks }, () => buff.modifiers))
      const modifiers = sumModifiers([...passive, ...activeSnapshot])
      const stats = applyModifiers(input.stats, modifiers)
      const commonInput = {
        resonatorLevel: input.resonatorLevel,
        enemyLevel: input.enemy.level,
        resistance: input.enemy.resistances[hit.element],
        resistanceReduction:
          (input.enemy.resistanceReductions?.[hit.element] ?? 0) +
          (modifiers.resistanceReduction ?? 0),
        defenseReduction: (input.enemy.defenseReduction ?? 0) + (modifiers.defenseReduction ?? 0),
        stats,
        damageType: hit.damageType,
        multiplier: hit.multiplier,
        criticalMode: input.criticalMode,
      }
      const breakdown = input.enemy.immuneElements?.includes(hit.element)
        ? {
            ...calculateDamage(commonInput),
            resistanceMultiplier: 0,
            finalDamage: 0,
          }
        : calculateDamage(commonInput)
      hits.push({ ...hit, breakdown })
    }

    for (const hit of timestampHits) {
      const definition = definitions.get(hit.actionId)
      if (!definition) throw new Error(`Unknown action: ${hit.actionId}`)
      applyEffects(definition, hit.resonatorSlotId, 'hit-after', timeMs, hit.id)
    }
  }

  const totalDamage = hits.reduce((total, hit) => total + hit.breakdown.finalDamage, 0)
  const durationMs = Math.max(0, ...hits.map((hit) => hit.timeMs))
  return {
    hits,
    totalDamage,
    durationMs,
    dps: durationMs > 0 ? totalDamage / (durationMs / 1000) : totalDamage,
    timeline: { windows: timeline.windows, diagnostics: timeline.diagnostics },
    buffIntervals,
    resourceCurve: [],
  }
}
