import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ActionWindow } from '../../../../../domain/combat'
import { useTimelineStore } from '../../../stores/timeline'
import {
  MAX_TIMELINE_ZOOM,
  MIN_TIMELINE_ZOOM,
  useTimelineViewportStore,
} from '../../../stores/timelineViewport'
import {
  DEFAULT_ACTION_LANES,
  MECHANIC_TRACK_HEIGHT,
  RESONATOR_TRACK_COUNT,
  TIMELINE_RULER_HEIGHT,
} from '../../../layout/timelineDimensions'

export const TIMELINE_INSET = 12

export function useTimelineViewport(getWindows: () => ActionWindow[]) {
  const timeline = useTimelineStore()
  const view = useTimelineViewportStore()
  const viewport = ref<HTMLElement>()
  const viewportHeight = ref(0)
  const width = computed(() => (timeline.durationMs / 1000) * view.zoomPxPerSecond)
  const baseActionHeight = computed(() => {
    const mechanicTracksHeight = MECHANIC_TRACK_HEIGHT * RESONATOR_TRACK_COUNT
    const actionLaneCount = DEFAULT_ACTION_LANES * RESONATOR_TRACK_COUNT
    return Math.max(
      34,
      Math.floor(
        (viewportHeight.value - TIMELINE_RULER_HEIGHT - mechanicTracksHeight) / actionLaneCount,
      ),
    )
  })
  let resizeObserver: ResizeObserver | undefined

  function labelWidth() {
    return viewport.value?.querySelector<HTMLElement>('.ruler-spacer')?.offsetWidth ?? 0
  }
  function minimumZoom() {
    if (!viewport.value) return MIN_TIMELINE_ZOOM
    const availableWidth = Math.max(1, viewport.value.clientWidth - labelWidth() - TIMELINE_INSET)
    return Math.max(MIN_TIMELINE_ZOOM, availableWidth / (timeline.durationMs / 1_000))
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
  async function setZoom(nextZoom: number, anchorTimeMs: number) {
    if (!viewport.value) return
    const oldZoom = view.zoomPxPerSecond
    const visibleTrackWidth = Math.max(0, viewport.value.clientWidth - labelWidth())
    const anchorOffset = Math.min(
      visibleTrackWidth,
      Math.max(0, TIMELINE_INSET + (anchorTimeMs / 1_000) * oldZoom - viewport.value.scrollLeft),
    )
    view.zoomPxPerSecond = Math.min(
      MAX_TIMELINE_ZOOM,
      Math.max(Math.ceil(minimumZoom()), Math.round(nextZoom)),
    )
    await nextTick()
    viewport.value.scrollLeft =
      TIMELINE_INSET + (anchorTimeMs / 1_000) * view.zoomPxPerSecond - anchorOffset
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
      MIN_TIMELINE_ZOOM,
      Math.min(MAX_TIMELINE_ZOOM, Math.floor(availableWidth / (fittedEndMs / 1000))),
    )
    await nextTick()
    viewport.value.scrollLeft = 0
    updateViewportMetrics()
  }
  function handleWheel(event: WheelEvent, anchorTimeMs: number) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      const step = view.zoomPxPerSecond < 20 ? 2 : 40
      void setZoom(view.zoomPxPerSecond + (event.deltaY < 0 ? step : -step), anchorTimeMs)
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
      if (view.zoomPxPerSecond < minimumZoom()) {
        view.zoomPxPerSecond = Math.ceil(minimumZoom())
      }
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
