import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ActionWindow } from '../../../../../domain/combat'
import { useTimelineStore } from '../../../stores/timeline'
import { useTimelineViewportStore } from '../../../stores/timelineViewport'

export const TIMELINE_INSET = 12

export function useTimelineViewport(getWindows: () => ActionWindow[]) {
  const timeline = useTimelineStore()
  const view = useTimelineViewportStore()
  const viewport = ref<HTMLElement>()
  const viewportHeight = ref(0)
  const width = computed(() => (timeline.durationMs / 1000) * view.zoomPxPerSecond)
  const baseActionHeight = computed(() => Math.max(42, Math.ceil((viewportHeight.value - 27) / 9)))
  let resizeObserver: ResizeObserver | undefined

  function labelWidth() {
    return viewport.value?.querySelector<HTMLElement>('.ruler-spacer')?.offsetWidth ?? 0
  }
  function updateViewportMetrics() {
    if (!viewport.value) return
    view.updateViewport(
      (Math.max(0, viewport.value.scrollLeft - TIMELINE_INSET) / view.zoomPxPerSecond) * 1000,
      (Math.max(0, viewport.value.clientWidth - labelWidth() - TIMELINE_INSET) /
        view.zoomPxPerSecond) *
        1000,
    )
  }
  async function setZoom(nextZoom: number, clientX?: number) {
    if (!viewport.value) return
    const oldZoom = view.zoomPxPerSecond
    const rect = viewport.value.getBoundingClientRect()
    const cursorOffset = Math.max(
      0,
      clientX === undefined
        ? (viewport.value.clientWidth - labelWidth()) / 2
        : clientX - rect.left - labelWidth(),
    )
    const cursorTime = Math.max(
      0,
      (viewport.value.scrollLeft + cursorOffset - TIMELINE_INSET) / oldZoom,
    )
    view.zoomPxPerSecond = Math.min(800, Math.max(1, Math.round(nextZoom)))
    await nextTick()
    viewport.value.scrollLeft = cursorTime * view.zoomPxPerSecond + TIMELINE_INSET - cursorOffset
    updateViewportMetrics()
  }
  async function fitTimeline() {
    if (!viewport.value) return
    const availableWidth = Math.max(
      1,
      viewport.value.clientWidth - labelWidth() - TIMELINE_INSET - 8,
    )
    const lastActionEndMs = Math.max(0, ...getWindows().map((window) => window.endTimeMs))
    const fittedEndMs = Math.min(
      timeline.durationMs,
      Math.max(1_000, lastActionEndMs + Math.max(500, lastActionEndMs * 0.05)),
    )
    view.zoomPxPerSecond = Math.max(
      1,
      Math.min(800, Math.floor(availableWidth / (fittedEndMs / 1000))),
    )
    await nextTick()
    viewport.value.scrollLeft = 0
    updateViewportMetrics()
  }
  function handleWheel(event: WheelEvent) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      const step = view.zoomPxPerSecond < 20 ? 2 : 40
      void setZoom(view.zoomPxPerSecond + (event.deltaY < 0 ? step : -step), event.clientX)
    } else if (event.shiftKey && viewport.value) {
      event.preventDefault()
      viewport.value.scrollLeft += event.deltaY || event.deltaX
      updateViewportMetrics()
    }
  }

  onMounted(async () => {
    await nextTick()
    if (!viewport.value) return
    const updateHeight = () => {
      viewportHeight.value = viewport.value?.clientHeight ?? 0
      updateViewportMetrics()
    }
    updateHeight()
    resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(viewport.value)
  })
  onBeforeUnmount(() => resizeObserver?.disconnect())

  return {
    viewport,
    width,
    baseActionHeight,
    updateViewportMetrics,
    setZoom,
    fitTimeline,
    handleWheel,
  }
}
