import { yangyangActions } from '../../../data/versions/v3_5/phaseOne'
import type { PlannedAction } from '../../../domain/combat'
import { ESTIMATED_MS_PER_HIT } from '../../../simulator/compiler/compileActions'

const actionDurations = new Map(
  yangyangActions.map((action) => [
    action.id,
    Math.max(1, action.hits.length) * ESTIMATED_MS_PER_HIT,
  ]),
)

export const cloneActions = (actions: PlannedAction[]) => actions.map((action) => ({ ...action }))
export const preciseTime = (value: number) => Math.round(value)
export const actionDurationMs = (actionId: string) =>
  actionDurations.get(actionId) ?? ESTIMATED_MS_PER_HIT

export function actionIntervals(
  actions: PlannedAction[],
  resonatorSlotId: string,
  excludedActionId?: string,
) {
  return actions
    .filter(
      (action) =>
        (action.resonatorSlotId ?? 'slot-1') === resonatorSlotId && action.id !== excludedActionId,
    )
    .map((action) => ({
      startTimeMs: action.startTimeMs,
      endTimeMs: Math.min(
        action.startTimeMs + actionDurationMs(action.actionId),
        action.trimmedEndTimeMs ?? Number.POSITIVE_INFINITY,
      ),
    }))
}
