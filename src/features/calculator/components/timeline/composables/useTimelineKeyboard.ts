import type { Ref } from 'vue'
import type { PlannedAction } from '../../../../../domain/combat'
import { useTimelineStore } from '../../../stores/timeline'
import { useTimelineViewportStore } from '../../../stores/timelineViewport'

export function useTimelineKeyboard(
  viewport: Ref<HTMLElement | undefined>,
  selectedActionId: () => string | undefined,
  removeAction: (id: string) => void,
  setZoom: (zoom: number) => Promise<void>,
  updateViewportMetrics: () => void,
) {
  const timeline = useTimelineStore()
  const view = useTimelineViewportStore()

  function handleTimelineKeydown(event: KeyboardEvent) {
    const selected = timeline.actions.find((action) => action.id === selectedActionId())
    if (selected && ['Delete', 'Backspace'].includes(event.key)) {
      event.preventDefault()
      removeAction(selected.id)
      return
    }
    if (selected && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault()
      const direction = event.key === 'ArrowLeft' ? -1 : 1
      timeline.moveAction(selected.id, selected.startTimeMs + direction * (event.shiftKey ? 50 : 1))
      return
    }
    if ((event.ctrlKey || event.metaKey) && ['+', '=', '-', '_'].includes(event.key)) {
      event.preventDefault()
      const step = view.zoomPxPerSecond < 20 ? 2 : 40
      void setZoom(view.zoomPxPerSecond + (['+', '='].includes(event.key) ? step : -step))
    } else if (['ArrowLeft', 'ArrowRight'].includes(event.key) && viewport.value) {
      event.preventDefault()
      const direction = event.key === 'ArrowLeft' ? -1 : 1
      const distance = event.shiftKey ? viewport.value.clientWidth * 0.8 : 100
      viewport.value.scrollLeft += direction * distance
      updateViewportMetrics()
    }
  }

  return { handleTimelineKeydown }
}

export function closestPeer(actions: PlannedAction[], removed: PlannedAction) {
  return actions
    .filter(
      (action) =>
        action.id !== removed.id &&
        (action.resonatorSlotId ?? 'slot-1') === (removed.resonatorSlotId ?? 'slot-1'),
    )
    .reduce<PlannedAction | undefined>((closest, action) => {
      if (!closest) return action
      return Math.abs(action.startTimeMs - removed.startTimeMs) <
        Math.abs(closest.startTimeMs - removed.startTimeMs)
        ? action
        : closest
    }, undefined)
}
