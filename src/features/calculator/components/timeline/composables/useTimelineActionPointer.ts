import type { Ref } from 'vue'
import type { ActionWindow, PlannedAction } from '../../../../../domain/combat'
import { canPlaceInterval } from '../../../layout/actionOverlap'
import { useTimelineStore } from '../../../stores/timeline'
import { useTimelineViewportStore } from '../../../stores/timelineViewport'

export function useTimelineActionPointer(
  getWindows: () => ActionWindow[],
  playheadMs: Ref<number>,
  pointerTime: (event: PointerEvent) => number,
) {
  const timeline = useTimelineStore()
  const view = useTimelineViewportStore()

  function beginDrag(event: PointerEvent, action: PlannedAction) {
    const originX = event.clientX
    const originTime = action.startTimeMs
    const actionWindow = getWindows().find((item) => item.actionInstanceId === action.id)
    const visibleDuration = (actionWindow?.endTimeMs ?? originTime) - originTime
    timeline.checkpoint()
    const move = (next: PointerEvent) => {
      let nextStart = originTime + ((next.clientX - originX) / view.zoomPxPerSecond) * 1000
      const thresholdMs = (8 / view.zoomPxPerSecond) * 1000
      if (Math.abs(nextStart - playheadMs.value) <= thresholdMs) nextStart = playheadMs.value
      else if (Math.abs(nextStart + visibleDuration - playheadMs.value) <= thresholdMs)
        nextStart = playheadMs.value - visibleDuration
      const otherWindows = getWindows().filter(
        (item) =>
          item.resonatorSlotId === (action.resonatorSlotId ?? 'slot-1') &&
          item.actionInstanceId !== action.id,
      )
      if (
        canPlaceInterval(
          otherWindows,
          { startTimeMs: nextStart, endTimeMs: nextStart + visibleDuration },
          4,
        )
      )
        timeline.moveAction(action.id, nextStart, false)
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }
  function beginTrim(_event: PointerEvent, action: PlannedAction) {
    timeline.checkpoint()
    const move = (next: PointerEvent) => timeline.trimAction(action.id, pointerTime(next), false)
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  return { beginDrag, beginTrim }
}
