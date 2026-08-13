import { computed, ref, type Ref } from 'vue'
import { useTimelineStore } from '../../../stores/timeline'
import { useTimelineViewportStore } from '../../../stores/timelineViewport'
import { TIMELINE_INSET } from './useTimelineViewport'

export function useTimelinePlayhead(viewport: Ref<HTMLElement | undefined>) {
  const timeline = useTimelineStore()
  const view = useTimelineViewportStore()
  const playheadMs = computed({
    get: () => view.playheadMs,
    set: (value: number) => view.setPlayhead(value, timeline.durationMs),
  })
  const playheadDragging = ref(false)

  function pointerTime(event: PointerEvent) {
    const trackLeft = viewport.value
      ?.querySelector<HTMLElement>('.resonator-track')
      ?.getBoundingClientRect().left
    return (
      ((event.clientX - (trackLeft ?? event.clientX) - TIMELINE_INSET) / view.zoomPxPerSecond) *
      1000
    )
  }
  function movePlayhead(event: PointerEvent) {
    playheadMs.value = Math.max(0, Math.min(timeline.durationMs, pointerTime(event)))
  }
  function setPlayheadFromPointer(event: PointerEvent) {
    const target = event.target as HTMLElement
    if (target.closest('.timeline-action, .resonator-label, .timeline-playhead')) return
    movePlayhead(event)
  }
  function beginPlayheadDrag(event: PointerEvent) {
    playheadDragging.value = true
    movePlayhead(event)
    const move = (next: PointerEvent) => movePlayhead(next)
    const stop = () => {
      playheadDragging.value = false
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  return { playheadMs, playheadDragging, pointerTime, setPlayheadFromPointer, beginPlayheadDrag }
}
