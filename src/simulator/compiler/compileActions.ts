import type { ActionDefinition, CompiledHit, PlannedAction } from '../../domain/combat'

export function compileActions(
  plannedActions: PlannedAction[],
  actionDefinitions: ActionDefinition[],
): CompiledHit[] {
  const definitions = new Map(actionDefinitions.map((action) => [action.id, action]))
  let sequence = 0

  return plannedActions
    .flatMap((plannedAction) => {
      const definition = definitions.get(plannedAction.actionId)
      if (!definition) throw new Error(`Unknown action: ${plannedAction.actionId}`)
      return definition.hits.map<CompiledHit>((hit) => ({
        id: `${plannedAction.id}:${hit.id}`,
        actionInstanceId: plannedAction.id,
        actionId: definition.id,
        actionName: definition.name,
        damageType: definition.damageType,
        element: definition.element,
        multiplier: hit.multiplier,
        timeMs: plannedAction.startTimeMs + hit.offsetMs,
        sequence: sequence++,
      }))
    })
    .sort((left, right) => left.timeMs - right.timeMs || left.sequence - right.sequence)
}
