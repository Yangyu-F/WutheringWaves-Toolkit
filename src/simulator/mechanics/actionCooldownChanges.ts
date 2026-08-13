import type { ActionDefinition, MechanicTrigger, SimulationInput } from '../../domain/combat'
import type { CooldownRuntime } from './cooldowns'
import { conditionMatches, type ConditionContext } from './modifiers'

export function applyActionCooldownChanges(options: {
  definition: ActionDefinition
  actionInstanceId: string
  resonatorSlotId: string
  trigger: MechanicTrigger
  timeMs: number
  hitId?: string
  input: SimulationInput
  conditionContext: ConditionContext
  cooldowns: CooldownRuntime
}) {
  const {
    definition,
    actionInstanceId,
    resonatorSlotId,
    trigger,
    timeMs,
    hitId,
    input,
    conditionContext,
    cooldowns,
  } = options
  for (const change of definition.cooldownChanges ?? []) {
    if (change.trigger !== trigger || (change.hitId && !hitId?.endsWith(`:${change.hitId}`)))
      continue
    if (change.condition && !conditionMatches(change, input, definition.id, conditionContext))
      continue
    for (const targetActionId of change.targetActionIds)
      cooldowns.change(
        definition,
        actionInstanceId,
        resonatorSlotId,
        targetActionId,
        change.operation,
        change.amountMs ?? 0,
        timeMs,
      )
  }
}
