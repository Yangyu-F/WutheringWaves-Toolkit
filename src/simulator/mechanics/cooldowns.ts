import type { ActionDefinition, MechanicEvent, TimelineDiagnostic } from '../../domain/combat'

interface ChargeState {
  maxCharges: number
  rechargeEnds: number[]
}

export function createCooldownRuntime(
  definitions: Map<string, ActionDefinition>,
  mechanicEvents: MechanicEvent[],
  diagnostics: TimelineDiagnostic[],
) {
  const states = new Map<string, ChargeState>()
  const keyFor = (slotId: string, actionId: string) => `${slotId}:${actionId}`

  function stateFor(slotId: string, definition: ActionDefinition) {
    const key = keyFor(slotId, definition.id)
    const state = states.get(key) ?? {
      maxCharges: Math.max(1, definition.maxCharges ?? 1),
      rechargeEnds: [],
    }
    states.set(key, state)
    return state
  }

  function refresh(state: ChargeState, timeMs: number) {
    state.rechargeEnds = state.rechargeEnds.filter((endTimeMs) => endTimeMs > timeMs)
  }

  function use(
    definition: ActionDefinition,
    actionInstanceId: string,
    resonatorSlotId: string,
    timeMs: number,
  ) {
    if (!definition.cooldownMs) return
    const state = stateFor(resonatorSlotId, definition)
    refresh(state, timeMs)
    if (state.rechargeEnds.length >= state.maxCharges) {
      diagnostics.push({
        code:
          definition.maxCharges && definition.maxCharges > 1
            ? 'no-action-charge'
            : 'cooldown-active',
        timeMs,
        actionInstanceIds: [actionInstanceId],
        availableAtMs: Math.min(...state.rechargeEnds),
      })
      return
    }
    const rechargeStart =
      definition.chargeRecoveryMode === 'sequential'
        ? Math.max(timeMs, state.rechargeEnds[state.rechargeEnds.length - 1] ?? timeMs)
        : timeMs
    state.rechargeEnds.push(rechargeStart + definition.cooldownMs)
    state.rechargeEnds.sort((left, right) => left - right)
  }

  function change(
    sourceDefinition: ActionDefinition,
    actionInstanceId: string,
    resonatorSlotId: string,
    targetActionId: string,
    operation: 'reduce' | 'reset' | 'restore-charge',
    amountMs: number,
    timeMs: number,
  ) {
    const target = definitions.get(targetActionId)
    if (!target?.cooldownMs) return
    const state = stateFor(resonatorSlotId, target)
    refresh(state, timeMs)
    if (operation === 'reset') state.rechargeEnds = []
    else if (operation === 'restore-charge') state.rechargeEnds.shift()
    else {
      state.rechargeEnds = state.rechargeEnds
        .map((endTimeMs) => Math.max(timeMs, endTimeMs - Math.max(0, amountMs)))
        .filter((endTimeMs) => endTimeMs > timeMs)
    }
    mechanicEvents.push({
      id: `${actionInstanceId}:cooldown:${targetActionId}:${timeMs}`,
      kind: operation === 'restore-charge' ? 'charge' : 'cooldown',
      sourceActionId: sourceDefinition.id,
      actionInstanceId,
      resonatorSlotId,
      timeMs,
      label: targetActionId,
      value: operation === 'reduce' ? -Math.max(0, amountMs) : undefined,
      generated: true,
    })
  }

  return { use, change }
}

export type CooldownRuntime = ReturnType<typeof createCooldownRuntime>
