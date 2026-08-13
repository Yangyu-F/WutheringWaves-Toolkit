import type {
  ActionDefinition,
  CompiledHit,
  CompiledTimeline,
  MechanicEvent,
  SimulationInput,
} from '../../domain/combat'
import { conditionMatches } from './modifiers'

export function compileDerivedEvents(
  timeline: CompiledTimeline,
  definitions: Map<string, ActionDefinition>,
  input: SimulationInput,
): { hits: CompiledHit[]; events: MechanicEvent[] } {
  let sequence = Math.max(0, ...timeline.hits.map((hit) => hit.sequence)) + 1
  const events: MechanicEvent[] = []
  const hits = [...timeline.starts, ...timeline.hits].flatMap((sourceEvent) => {
    const definition = definitions.get(sourceEvent.actionId)
    if (!definition) return []
    const sourceHitId = 'id' in sourceEvent ? String(sourceEvent.id) : undefined
    const trigger = sourceHitId ? 'hit-after' : 'action-start'
    return (definition.derivedEvents ?? []).flatMap((derived) => {
      if (derived.trigger !== trigger) return []
      if (derived.hitId && (!sourceHitId || !sourceHitId.endsWith(`:${derived.hitId}`))) return []
      if (derived.condition && !conditionMatches(derived, input, definition.id)) return []
      return Array.from({ length: derived.occurrences }, (_, occurrence) => {
        const timeMs = sourceEvent.timeMs + derived.delayMs + occurrence * (derived.intervalMs ?? 0)
        events.push({
          id: `${sourceEvent.actionInstanceId}:${derived.id}:${occurrence}`,
          kind: derived.kind,
          sourceActionId: definition.id,
          actionInstanceId: sourceEvent.actionInstanceId,
          resonatorSlotId: sourceEvent.resonatorSlotId,
          timeMs,
          label: derived.id,
          target: 'enemy',
          generated: true,
        })
        return (derived.hits ?? []).map((hit, hitIndex) => ({
          id: `${sourceEvent.actionInstanceId}:${derived.id}:${occurrence}:${hit.id}`,
          actionInstanceId: sourceEvent.actionInstanceId,
          actionId: definition.id,
          actionName: derived.id,
          resonatorSlotId: sourceEvent.resonatorSlotId,
          damageType: definition.damageType,
          element: definition.element,
          multiplier: hit.multiplier,
          scalingStat: hit.scalingStat ?? 'attack',
          timeMs: timeMs + hitIndex * 50,
          sequence: sequence++,
        }))
      }).flat()
    })
  })
  return { hits, events }
}
