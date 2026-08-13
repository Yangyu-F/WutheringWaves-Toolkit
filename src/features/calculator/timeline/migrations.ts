import type { PlannedAction } from '../../../domain/combat'
import { timelineDocumentSchema, timelineDocumentV1Schema, type TimelineDocument } from './schema'

function migrateV1(raw: unknown): TimelineDocument | undefined {
  const parsed = timelineDocumentV1Schema.safeParse(raw)
  if (!parsed.success) return undefined
  const actions: PlannedAction[] = []
  for (const item of parsed.data.actions) {
    if (item.kind === 'dodge') {
      const target = [...actions]
        .reverse()
        .find(
          (action) =>
            action.startTimeMs <= item.startTimeMs && action.trimmedEndTimeMs === undefined,
        )
      if (target && item.startTimeMs > target.startTimeMs)
        target.trimmedEndTimeMs = item.startTimeMs
      continue
    }
    actions.push({
      id: item.id,
      resonatorSlotId: 'slot-1',
      actionId: item.actionId,
      startTimeMs: item.startTimeMs,
    })
  }
  return {
    schemaVersion: 2,
    durationMs: parsed.data.durationMs,
    snapMs: parsed.data.snapMs,
    actions: actions.map((action) => ({ ...action, resonatorSlotId: 'slot-1' })),
    switches: [],
  }
}

export function parseTimelineDocument(raw: unknown): TimelineDocument | undefined {
  const current = timelineDocumentSchema.safeParse(raw)
  return current.success ? current.data : migrateV1(raw)
}
