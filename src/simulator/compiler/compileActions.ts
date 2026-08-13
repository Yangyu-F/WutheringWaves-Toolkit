import type {
  ActionDefinition,
  ActionWindow,
  CompiledHit,
  CompiledTimeline,
  PlannedAction,
  TimelineDiagnostic,
} from '../../domain/combat'

export const ESTIMATED_MS_PER_HIT = 50

function estimatedDurationMs(hitCount: number): number {
  return Math.max(1, hitCount) * ESTIMATED_MS_PER_HIT
}

function hitTimeMs(startTimeMs: number, index: number): number {
  return startTimeMs + index * ESTIMATED_MS_PER_HIT
}

export function compileTimeline(
  plannedActions: PlannedAction[],
  actionDefinitions: ActionDefinition[],
): CompiledTimeline {
  const definitions = new Map(actionDefinitions.map((action) => [action.id, action]))
  const ordered = plannedActions
    .map((action, inputSequence) => ({ ...action, inputSequence }))
    .sort(
      (left, right) =>
        left.startTimeMs - right.startTimeMs || left.inputSequence - right.inputSequence,
    )
  const diagnostics: TimelineDiagnostic[] = []
  const windows: ActionWindow[] = []
  let sequence = 0

  for (const plannedAction of ordered) {
    const definition = definitions.get(plannedAction.actionId)
    if (!definition) {
      diagnostics.push({
        code: 'unknown-action',
        timeMs: plannedAction.startTimeMs,
        actionInstanceIds: [plannedAction.id],
      })
      continue
    }
    const durationMs = estimatedDurationMs(definition.hits.length)
    const naturalEndTimeMs = plannedAction.startTimeMs + durationMs
    const requestedEndTimeMs = plannedAction.trimmedEndTimeMs ?? naturalEndTimeMs
    const endTimeMs = Math.max(
      plannedAction.startTimeMs,
      Math.min(naturalEndTimeMs, requestedEndTimeMs),
    )
    if (
      plannedAction.trimmedEndTimeMs !== undefined &&
      (plannedAction.trimmedEndTimeMs < plannedAction.startTimeMs ||
        plannedAction.trimmedEndTimeMs > naturalEndTimeMs)
    ) {
      diagnostics.push({
        code: 'invalid-trim',
        timeMs: plannedAction.startTimeMs,
        actionInstanceIds: [plannedAction.id],
      })
    }
    windows.push({
      actionInstanceId: plannedAction.id,
      actionId: plannedAction.actionId,
      resonatorSlotId: plannedAction.resonatorSlotId ?? 'slot-1',
      startTimeMs: plannedAction.startTimeMs,
      endTimeMs,
      naturalEndTimeMs,
      trimmed: endTimeMs < naturalEndTimeMs,
      timingSource: 'estimated',
    })
  }

  const starts = windows
    .map((window) => ({
      actionInstanceId: window.actionInstanceId,
      actionId: window.actionId,
      resonatorSlotId: window.resonatorSlotId,
      timeMs: window.startTimeMs,
      sequence: sequence++,
    }))
    .sort((left, right) => left.timeMs - right.timeMs || left.sequence - right.sequence)

  const hits = windows
    .flatMap((window) => {
      const definition = definitions.get(window.actionId)
      if (!definition) return []
      return definition.hits
        .map<CompiledHit>((hit, index) => ({
          id: `${window.actionInstanceId}:${hit.id}`,
          actionInstanceId: window.actionInstanceId,
          actionId: definition.id,
          actionName: definition.name,
          resonatorSlotId: window.resonatorSlotId,
          damageType: definition.damageType,
          element: definition.element,
          multiplier: hit.multiplier,
          scalingStat: hit.scalingStat ?? 'attack',
          timeMs: hitTimeMs(window.startTimeMs, index),
          sequence: sequence++,
        }))
        .filter((hit) => hit.timeMs <= window.endTimeMs)
    })
    .sort((left, right) => left.timeMs - right.timeMs || left.sequence - right.sequence)

  return { starts, hits, windows, diagnostics }
}

export function compileActions(
  plannedActions: PlannedAction[],
  actionDefinitions: ActionDefinition[],
): CompiledHit[] {
  const compiled = compileTimeline(plannedActions, actionDefinitions)
  const unknown = compiled.diagnostics.find((diagnostic) => diagnostic.code === 'unknown-action')
  if (unknown) {
    const action = plannedActions.find((item) => item.id === unknown.actionInstanceIds[0])
    throw new Error(`Unknown action: ${action?.actionId ?? unknown.actionInstanceIds[0]}`)
  }
  return compiled.hits
}
