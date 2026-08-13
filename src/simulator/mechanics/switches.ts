import type {
  ActionDefinition,
  CompiledActionStart,
  MechanicEvent,
  PlannedSwitchEvent,
  TimelineDiagnostic,
} from '../../domain/combat'

export function orderSwitches(events: PlannedSwitchEvent[]) {
  return [...events].sort(
    (left, right) => left.timeMs - right.timeMs || left.id.localeCompare(right.id),
  )
}

export function applySwitchesAt(
  switches: PlannedSwitchEvent[],
  timeMs: number,
  currentActiveSlotId: string,
  mechanicEvents: MechanicEvent[],
): { activeSlotId: string; events: PlannedSwitchEvent[] } {
  const events = switches.filter((event) => event.timeMs === timeMs)
  let activeSlotId = currentActiveSlotId
  for (const switchEvent of events) {
    activeSlotId = switchEvent.toSlotId
    mechanicEvents.push({
      id: switchEvent.id,
      kind: 'switch',
      sourceActionId: switchEvent.id,
      actionInstanceId: switchEvent.id,
      resonatorSlotId: switchEvent.fromSlotId,
      targetSlotId: switchEvent.toSlotId,
      timeMs,
      label: `${switchEvent.fromSlotId}->${switchEvent.toSlotId}`,
      generated: false,
    })
  }
  return { activeSlotId, events }
}

export function validateSwitchActivation(
  definition: ActionDefinition,
  start: CompiledActionStart,
  switches: PlannedSwitchEvent[],
  diagnostics: TimelineDiagnostic[],
) {
  const invalidIntro =
    definition.activation === 'intro' &&
    !switches.some((event) => event.toSlotId === start.resonatorSlotId)
  const invalidOutro =
    definition.activation === 'outro' &&
    !switches.some((event) => event.fromSlotId === start.resonatorSlotId)
  if (!invalidIntro && !invalidOutro) return
  diagnostics.push({
    code: invalidIntro ? 'invalid-intro-source' : 'invalid-outro-source',
    timeMs: start.timeMs,
    actionInstanceIds: [start.actionInstanceId],
  })
}
