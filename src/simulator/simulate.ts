import type {
  ActionDefinition,
  CombatModifiers,
  MechanicTrigger,
  ResonatorMechanicsDefinition,
  SimulationInput,
  SimulationResult,
} from '../domain/combat'
import { calculateDamage } from './calculation/damage'
import { compileTimeline } from './compiler/compileActions'
import { applyActionCooldownChanges } from './mechanics/actionCooldownChanges'
import { createCooldownRuntime } from './mechanics/cooldowns'
import { compileDerivedEvents } from './mechanics/deriveEvents'
import {
  applyModifiers,
  conditionMatches,
  resolveModifiers,
  sumModifiers,
} from './mechanics/modifiers'
import { calculateShield } from './mechanics/shields'
import { applySwitchesAt, orderSwitches, validateSwitchActivation } from './mechanics/switches'

interface ActiveBuff {
  definitionId: string
  expiresAt: number
  stacks: number
  maxStacks: number
  modifiers: CombatModifiers
  targetTrack: SimulationResult['buffIntervals'][number]['targetTrack']
}

export function simulateDamage(
  input: SimulationInput,
  actionDefinitions: ActionDefinition[],
  mechanics: ResonatorMechanicsDefinition = { resources: [] },
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
  const resourceCurve: SimulationResult['resourceCurve'] = []
  const resourceValues = new Map<string, number>()
  const resourceTriggerCooldowns = new Map<string, number>()
  const diagnostics = [...timeline.diagnostics]
  const healing: SimulationResult['healing'] = []
  const shields: SimulationResult['shields'] = []
  const mechanicEvents: SimulationResult['mechanicEvents'] = []
  const statusIntervals: SimulationResult['statusIntervals'] = []
  const activeStatuses = new Map<string, number>()
  const activeShieldExpiries = new Map<string, number>()
  let activeSlotId = input.initialActiveSlotId ?? input.team?.[0]?.slotId ?? 'slot-1'
  const cooldowns = createCooldownRuntime(definitions, mechanicEvents, diagnostics)

  const shieldedSlotIds = (timeMs: number) => {
    for (const [slotId, expiresAt] of activeShieldExpiries)
      if (timeMs > expiresAt) activeShieldExpiries.delete(slotId)
    return new Set(activeShieldExpiries.keys())
  }
  const conditionContext = (resonatorSlotId: string, timeMs: number) => ({
    resonatorSlotId,
    activeSlotId,
    shieldedSlotIds: shieldedSlotIds(timeMs),
  })
  const combatStateAt = (definition: ActionDefinition, resonatorSlotId: string, timeMs: number) => {
    const passive = (definition.passiveModifiers ?? [])
      .filter((effect) =>
        conditionMatches(effect, input, definition.id, conditionContext(resonatorSlotId, timeMs)),
      )
      .map((effect) => resolveModifiers(effect.modifiers, input))
    const activeSnapshot = [...activeBuffs.values()]
      .filter(
        (buff) =>
          buff.targetTrack === 'team' ||
          buff.targetTrack === 'enemy' ||
          buff.targetTrack === resonatorSlotId,
      )
      .flatMap((buff) => Array.from({ length: buff.stacks }, () => buff.modifiers))
    const modifiers = sumModifiers([...passive, ...activeSnapshot])
    return { modifiers, stats: applyModifiers(input.stats, modifiers) }
  }

  const resourceKey = (resonatorSlotId: string, resourceId: string) =>
    `${resonatorSlotId}:${resourceId}`
  const resourceDefinition = (resourceId: string) =>
    mechanics.resources.find((resource) => resource.id === resourceId)
  const readResource = (resonatorSlotId: string, resourceId: string) => {
    const definition = resourceDefinition(resourceId)
    return (
      resourceValues.get(resourceKey(resonatorSlotId, resourceId)) ??
      input.initialResources?.[resourceId] ??
      definition?.initialValue ??
      0
    )
  }
  const changeResource = (
    resonatorSlotId: string,
    resourceId: string,
    amount: number,
    timeMs: number,
    sourceActionId: string,
    actionInstanceId: string,
  ) => {
    const definition = resourceDefinition(resourceId)
    if (!definition) return
    const previous = readResource(resonatorSlotId, resourceId)
    const value = Math.max(
      definition.minimumValue,
      Math.min(definition.maximumValue, previous + amount),
    )
    resourceValues.set(resourceKey(resonatorSlotId, resourceId), value)
    resourceCurve.push({
      resourceId,
      resonatorSlotId,
      timeMs,
      value,
      change: value - previous,
      sourceActionId,
    })
    mechanicEvents.push({
      id: `${sourceActionId}:${resourceId}:${timeMs}:${resourceCurve.length}`,
      kind: 'resource',
      sourceActionId,
      actionInstanceId,
      resonatorSlotId,
      timeMs,
      label: resourceId,
      value: value - previous,
      generated: true,
    })
  }

  for (const slotId of new Set(timeline.windows.map((window) => window.resonatorSlotId))) {
    for (const resource of mechanics.resources) {
      const initialValue = Math.max(
        resource.minimumValue,
        Math.min(
          resource.maximumValue,
          input.initialResources?.[resource.id] ?? resource.initialValue,
        ),
      )
      resourceValues.set(resourceKey(slotId, resource.id), initialValue)
      resourceCurve.push({
        resourceId: resource.id,
        resonatorSlotId: slotId,
        timeMs: 0,
        value: initialValue,
        change: 0,
      })
    }
  }

  const applyEffects = (
    definition: ActionDefinition,
    resonatorSlotId: string,
    trigger: MechanicTrigger,
    timeMs: number,
    hitId?: string,
  ) => {
    for (const effect of definition.effects ?? []) {
      if (effect.trigger !== trigger || (effect.hitId && !hitId?.endsWith(`:${effect.hitId}`)))
        continue
      if (
        !conditionMatches(effect, input, definition.id, conditionContext(resonatorSlotId, timeMs))
      )
        continue
      const targetTrack =
        effect.target === 'team' || effect.target === 'enemy'
          ? effect.target
          : effect.target === 'active'
            ? (activeSlotId as 'slot-1' | 'slot-2' | 'slot-3')
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

  const applyResourceChanges = (
    definition: ActionDefinition,
    actionInstanceId: string,
    resonatorSlotId: string,
    trigger: MechanicTrigger,
    timeMs: number,
    hitId?: string,
  ) => {
    for (const change of definition.resourceChanges ?? []) {
      if (change.trigger !== trigger || (change.hitId && !hitId?.endsWith(`:${change.hitId}`)))
        continue
      if (
        change.condition &&
        !conditionMatches(change, input, definition.id, conditionContext(resonatorSlotId, timeMs))
      )
        continue
      const cooldownKey = `${resonatorSlotId}:${change.id}`
      const availableAt = resourceTriggerCooldowns.get(cooldownKey) ?? 0
      if (timeMs < availableAt) continue
      changeResource(
        resonatorSlotId,
        change.resourceId,
        change.amount,
        timeMs,
        definition.id,
        actionInstanceId,
      )
      if (change.internalCooldownMs)
        resourceTriggerCooldowns.set(cooldownKey, timeMs + change.internalCooldownMs)
    }
  }

  const applyHealing = (
    definition: ActionDefinition,
    actionInstanceId: string,
    resonatorSlotId: string,
    trigger: MechanicTrigger,
    timeMs: number,
    hitId?: string,
  ) => {
    for (const recovery of definition.healing ?? []) {
      if (
        recovery.trigger !== trigger ||
        (recovery.hitId && !hitId?.endsWith(`:${recovery.hitId}`))
      )
        continue
      if (
        recovery.condition &&
        !conditionMatches(recovery, input, definition.id, conditionContext(resonatorSlotId, timeMs))
      )
        continue
      const stats = combatStateAt(definition, resonatorSlotId, timeMs).stats
      const scalingBase = recovery.scalingStat === 'flat' ? 0 : (stats[recovery.scalingStat] ?? 0)
      const flatValue = recovery.flatValue ?? 0
      const healingBonusMultiplier = 1 + (input.stats.healingBonus ?? 0)
      const healingReceivedMultiplier = 1 + (input.stats.healingReceivedBonus ?? 0)
      const finalHealing =
        (scalingBase * recovery.multiplier + flatValue) *
        healingBonusMultiplier *
        healingReceivedMultiplier
      healing.push({
        id: recovery.id,
        sourceActionId: definition.id,
        actionInstanceId,
        resonatorSlotId,
        target: recovery.target,
        timeMs,
        scalingStat: recovery.scalingStat,
        scalingBase,
        multiplier: recovery.multiplier,
        flatValue,
        healingBonusMultiplier,
        healingReceivedMultiplier,
        finalHealing,
      })
      mechanicEvents.push({
        id: recovery.id,
        kind: 'healing',
        sourceActionId: definition.id,
        actionInstanceId,
        resonatorSlotId,
        timeMs,
        label: recovery.id,
        value: finalHealing,
        target: recovery.target,
        generated: true,
      })
    }
  }

  const applyStatusChanges = (
    definition: ActionDefinition,
    actionInstanceId: string,
    resonatorSlotId: string,
    trigger: MechanicTrigger,
    timeMs: number,
    hitId?: string,
  ) => {
    for (const change of definition.statusChanges ?? []) {
      if (change.trigger !== trigger || (change.hitId && !hitId?.endsWith(`:${change.hitId}`)))
        continue
      if (
        change.condition &&
        !conditionMatches(change, input, definition.id, conditionContext(resonatorSlotId, timeMs))
      )
        continue
      const key = `${resonatorSlotId}:${change.statusId}`
      if (change.operation === 'remove') {
        activeStatuses.delete(key)
        continue
      }
      const endTimeMs = timeMs + (change.durationMs ?? Number.MAX_SAFE_INTEGER)
      activeStatuses.set(key, endTimeMs)
      statusIntervals.push({
        id: `${actionInstanceId}:${change.id}`,
        statusId: change.statusId,
        resonatorSlotId,
        sourceActionId: definition.id,
        startTimeMs: timeMs,
        endTimeMs,
      })
    }
  }

  const applyCooldownChanges = (
    definition: ActionDefinition,
    actionInstanceId: string,
    resonatorSlotId: string,
    trigger: MechanicTrigger,
    timeMs: number,
    hitId?: string,
  ) => {
    applyActionCooldownChanges({
      definition,
      actionInstanceId,
      resonatorSlotId,
      trigger,
      timeMs,
      hitId,
      input,
      conditionContext: conditionContext(resonatorSlotId, timeMs),
      cooldowns,
    })
  }

  const applyShields = (
    definition: ActionDefinition,
    actionInstanceId: string,
    resonatorSlotId: string,
    trigger: 'action-start' | 'hit-after',
    timeMs: number,
    hitId?: string,
  ) => {
    for (const shield of definition.shields ?? []) {
      if (shield.trigger !== trigger || (shield.hitId && !hitId?.endsWith(`:${shield.hitId}`)))
        continue
      if (
        shield.condition &&
        !conditionMatches(shield, input, definition.id, conditionContext(resonatorSlotId, timeMs))
      )
        continue
      const targetSlotId = shield.target === 'self' ? resonatorSlotId : activeSlotId
      const result = calculateShield(
        shield,
        combatStateAt(definition, resonatorSlotId, timeMs).stats,
        definition.id,
        actionInstanceId,
        resonatorSlotId,
        shield.target === 'team' ? undefined : targetSlotId,
        timeMs,
      )
      shields.push(result)
      const affectedSlots =
        shield.target === 'team'
          ? (input.team?.map((member) => member.slotId) ?? [resonatorSlotId])
          : [targetSlotId]
      for (const slotId of affectedSlots)
        activeShieldExpiries.set(
          slotId,
          Math.max(activeShieldExpiries.get(slotId) ?? 0, result.endTimeMs),
        )
      mechanicEvents.push({
        id: `${actionInstanceId}:${shield.id}:${timeMs}`,
        kind: 'shield',
        sourceActionId: definition.id,
        actionInstanceId,
        resonatorSlotId,
        timeMs,
        label: shield.id,
        value: result.finalShield,
        target: shield.target,
        targetSlotId: result.targetSlotId,
        generated: true,
      })
      applyEffects(definition, resonatorSlotId, 'shield-gained', timeMs)
      applyResourceChanges(definition, actionInstanceId, resonatorSlotId, 'shield-gained', timeMs)
      applyCooldownChanges(definition, actionInstanceId, resonatorSlotId, 'shield-gained', timeMs)
    }
  }

  const derived = compileDerivedEvents(timeline, definitions, input)
  mechanicEvents.push(...derived.events)
  const derivedHits = derived.hits
  const compiledHits = [...timeline.hits, ...derivedHits].sort(
    (left, right) => left.timeMs - right.timeMs || left.sequence - right.sequence,
  )

  const switches = orderSwitches(input.switches ?? [])
  const timestamps = [
    ...new Set([
      ...timeline.starts.map((event) => event.timeMs),
      ...compiledHits.map((event) => event.timeMs),
      ...switches.map((event) => event.timeMs),
    ]),
  ].sort((left, right) => left - right)
  const hits: SimulationResult['hits'] = []

  for (const timeMs of timestamps) {
    for (const [id, buff] of activeBuffs) if (timeMs > buff.expiresAt) activeBuffs.delete(id)
    for (const [id, expiresAt] of activeStatuses) if (timeMs > expiresAt) activeStatuses.delete(id)
    shieldedSlotIds(timeMs)

    const switchResult = applySwitchesAt(switches, timeMs, activeSlotId, mechanicEvents)
    activeSlotId = switchResult.activeSlotId
    const timestampSwitches = switchResult.events

    for (const start of timeline.starts.filter((event) => event.timeMs === timeMs)) {
      const definition = definitions.get(start.actionId)
      if (!definition) throw new Error(`Unknown action: ${start.actionId}`)
      validateSwitchActivation(definition, start, timestampSwitches, diagnostics)
      for (const requirement of definition.resourceRequirements ?? []) {
        const actualValue = readResource(start.resonatorSlotId, requirement.resourceId)
        if (actualValue < requirement.minimumValue)
          diagnostics.push({
            code: 'insufficient-resource',
            timeMs,
            actionInstanceIds: [start.actionInstanceId],
            resourceId: requirement.resourceId,
            requiredValue: requirement.minimumValue,
            actualValue,
          })
      }
      for (const requirement of definition.statusRequirements ?? []) {
        const active = activeStatuses.has(`${start.resonatorSlotId}:${requirement.statusId}`)
        if (active !== requirement.active)
          diagnostics.push({
            code: 'missing-status',
            timeMs,
            actionInstanceIds: [start.actionInstanceId],
            statusId: requirement.statusId,
          })
      }
      cooldowns.use(definition, start.actionInstanceId, start.resonatorSlotId, timeMs)
      applyResourceChanges(
        definition,
        start.actionInstanceId,
        start.resonatorSlotId,
        'action-start',
        timeMs,
      )
      applyEffects(definition, start.resonatorSlotId, 'action-start', timeMs)
      applyStatusChanges(
        definition,
        start.actionInstanceId,
        start.resonatorSlotId,
        'action-start',
        timeMs,
      )
      applyHealing(
        definition,
        start.actionInstanceId,
        start.resonatorSlotId,
        'action-start',
        timeMs,
      )
      applyShields(
        definition,
        start.actionInstanceId,
        start.resonatorSlotId,
        'action-start',
        timeMs,
      )
      applyCooldownChanges(
        definition,
        start.actionInstanceId,
        start.resonatorSlotId,
        'action-start',
        timeMs,
      )
    }

    const timestampHits = compiledHits.filter((hit) => hit.timeMs === timeMs)
    for (const hit of timestampHits) {
      const definition = definitions.get(hit.actionId)
      if (!definition) throw new Error(`Unknown action: ${hit.actionId}`)
      const { modifiers, stats } = combatStateAt(definition, hit.resonatorSlotId, timeMs)
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
        scalingStat: hit.scalingStat,
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
      applyStatusChanges(
        definition,
        hit.actionInstanceId,
        hit.resonatorSlotId,
        'hit-after',
        timeMs,
        hit.id,
      )
      applyResourceChanges(
        definition,
        hit.actionInstanceId,
        hit.resonatorSlotId,
        'hit-after',
        timeMs,
        hit.id,
      )
      applyHealing(
        definition,
        hit.actionInstanceId,
        hit.resonatorSlotId,
        'hit-after',
        timeMs,
        hit.id,
      )
      applyShields(
        definition,
        hit.actionInstanceId,
        hit.resonatorSlotId,
        'hit-after',
        timeMs,
        hit.id,
      )
      applyCooldownChanges(
        definition,
        hit.actionInstanceId,
        hit.resonatorSlotId,
        'hit-after',
        timeMs,
        hit.id,
      )
    }
  }

  const totalDamage = hits.reduce((total, hit) => total + hit.breakdown.finalDamage, 0)
  const totalHealing = healing.reduce((total, event) => total + event.finalHealing, 0)
  const totalShield = shields.reduce((total, event) => total + event.finalShield, 0)
  const durationMs = Math.max(
    0,
    ...hits.map((hit) => hit.timeMs),
    ...healing.map((event) => event.timeMs),
  )
  return {
    hits,
    totalDamage,
    durationMs,
    dps: durationMs > 0 ? totalDamage / (durationMs / 1000) : totalDamage,
    healing,
    totalHealing,
    hps: durationMs > 0 ? totalHealing / (durationMs / 1000) : totalHealing,
    shields,
    totalShield,
    timeline: { windows: timeline.windows, diagnostics },
    buffIntervals,
    resourceCurve,
    mechanicEvents,
    statusIntervals,
  }
}
