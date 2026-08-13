import { defineStore } from 'pinia'
import type { PlannedAction } from '../../../domain/combat'
import { canPlaceInterval, findAvailableStart } from '../layout/actionOverlap'
import {
  actionDurationMs,
  actionIntervals,
  cloneActions,
  preciseTime,
} from '../timeline/actionModel'
import type { TimelineDocument } from '../timeline/schema'

export { timelineDocumentSchema, type TimelineDocument } from '../timeline/schema'

export const DEFAULT_TIMELINE_DURATION_MS = 60_000
const MAX_TIMELINE_DURATION_MS = 120_000
const MAX_HISTORY_LENGTH = 100

const initialActions: PlannedAction[] = [
  { id: 'action-1', resonatorSlotId: 'slot-1', actionId: 'changtai-gongji-1', startTimeMs: 0 },
  { id: 'action-2', resonatorSlotId: 'slot-1', actionId: 'changtai-gongji-2', startTimeMs: 600 },
  {
    id: 'action-3',
    resonatorSlotId: 'slot-1',
    actionId: 'changtai-gongji-3',
    startTimeMs: 1_500,
  },
  {
    id: 'action-4',
    resonatorSlotId: 'slot-1',
    actionId: 'changtai-gongji-4',
    startTimeMs: 2_400,
  },
]

export const useTimelineStore = defineStore('calculator-timeline', {
  state: () => ({
    durationMs: DEFAULT_TIMELINE_DURATION_MS,
    snapMs: 1,
    actions: cloneActions(initialActions),
    past: [] as PlannedAction[][],
    future: [] as PlannedAction[][],
    nextId: 5,
    lastAddedActionId: '',
    operationMessage: '' as '' | 'maximum-overlap' | 'no-visible-space',
  }),
  actions: {
    checkpoint() {
      this.past.push(cloneActions(this.actions))
      if (this.past.length > MAX_HISTORY_LENGTH) this.past.shift()
      this.future = []
    },
    addAction(actionId: string, resonatorSlotId = 'slot-1', startTimeMs?: number) {
      const lastStart = Math.max(-1, ...this.actions.map((action) => action.startTimeMs))
      const resolvedStartTimeMs = Math.min(
        this.durationMs,
        preciseTime(startTimeMs ?? lastStart + 400),
      )
      if (
        !canPlaceInterval(actionIntervals(this.actions, resonatorSlotId), {
          startTimeMs: resolvedStartTimeMs,
          endTimeMs: resolvedStartTimeMs + actionDurationMs(actionId),
        })
      ) {
        this.operationMessage = 'maximum-overlap'
        return
      }
      this.checkpoint()
      const id = `action-${this.nextId++}`
      this.actions.push({ id, resonatorSlotId, actionId, startTimeMs: resolvedStartTimeMs })
      this.lastAddedActionId = id
      this.operationMessage = ''
      return id
    },
    addActionToViewport(
      actionId: string,
      resonatorSlotId: string,
      viewportStartMs: number,
      viewportDurationMs: number,
    ) {
      const durationMs = actionDurationMs(actionId)
      const startTimeMs = findAvailableStart(
        actionIntervals(this.actions, resonatorSlotId),
        durationMs,
        viewportStartMs + viewportDurationMs / 2,
        viewportStartMs,
        Math.min(this.durationMs - durationMs, viewportStartMs + viewportDurationMs),
      )
      if (startTimeMs !== undefined) return this.addAction(actionId, resonatorSlotId, startTimeMs)
      this.operationMessage = 'no-visible-space'
    },
    moveAction(id: string, rawTimeMs: number, checkpoint = true) {
      const action = this.actions.find((item) => item.id === id)
      if (!action) return
      const nextStartTimeMs = Math.max(0, Math.min(this.durationMs, preciseTime(rawTimeMs)))
      const durationMs = Math.min(
        actionDurationMs(action.actionId),
        Math.max(0, (action.trimmedEndTimeMs ?? Number.POSITIVE_INFINITY) - action.startTimeMs),
      )
      if (
        !canPlaceInterval(
          actionIntervals(this.actions, action.resonatorSlotId ?? 'slot-1', action.id),
          { startTimeMs: nextStartTimeMs, endTimeMs: nextStartTimeMs + durationMs },
        )
      ) {
        this.operationMessage = 'maximum-overlap'
        return
      }
      if (checkpoint) this.checkpoint()
      const previousStart = action.startTimeMs
      action.startTimeMs = nextStartTimeMs
      if (action.trimmedEndTimeMs !== undefined)
        action.trimmedEndTimeMs += action.startTimeMs - previousStart
      this.operationMessage = ''
    },
    trimAction(id: string, rawEndTimeMs?: number, checkpoint = true) {
      const action = this.actions.find((item) => item.id === id)
      if (!action) return
      if (checkpoint) this.checkpoint()
      if (rawEndTimeMs === undefined) {
        action.trimmedEndTimeMs = undefined
        return
      }
      const naturalEndTimeMs = Math.min(
        this.durationMs,
        action.startTimeMs + actionDurationMs(action.actionId),
      )
      const trimmedEndTimeMs = Math.max(
        action.startTimeMs,
        Math.min(naturalEndTimeMs, preciseTime(rawEndTimeMs)),
      )
      action.trimmedEndTimeMs = trimmedEndTimeMs < naturalEndTimeMs ? trimmedEndTimeMs : undefined
    },
    removeAction(id: string) {
      this.checkpoint()
      this.actions = this.actions.filter((action) => action.id !== id)
    },
    replaceDocument(document: TimelineDocument) {
      this.durationMs = Math.min(MAX_TIMELINE_DURATION_MS, document.durationMs)
      this.snapMs = 1
      this.actions = cloneActions(document.actions)
      this.nextId = document.actions.length + 1
      this.past = []
      this.future = []
    },
    undo() {
      const previous = this.past.pop()
      if (!previous) return
      this.future.push(cloneActions(this.actions))
      this.actions = previous
    },
    redo() {
      const next = this.future.pop()
      if (!next) return
      this.past.push(cloneActions(this.actions))
      this.actions = next
    },
    document(): TimelineDocument {
      return {
        schemaVersion: 2,
        durationMs: this.durationMs,
        snapMs: this.snapMs,
        actions: this.actions.map((action) => ({
          ...action,
          resonatorSlotId: action.resonatorSlotId ?? 'slot-1',
        })),
      }
    },
  },
})
