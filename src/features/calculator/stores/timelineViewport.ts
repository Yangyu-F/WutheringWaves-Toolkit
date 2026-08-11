import { defineStore } from 'pinia'

export type ResonatorSlotId = 'slot-1' | 'slot-2' | 'slot-3'

export const useTimelineViewportStore = defineStore('calculator-timeline-viewport', {
  state: () => ({
    zoomPxPerSecond: 80,
    viewportStartMs: 0,
    viewportDurationMs: 0,
    activeResonatorSlotId: 'slot-1' as ResonatorSlotId,
  }),
  actions: {
    updateViewport(startTimeMs: number, durationMs: number) {
      this.viewportStartMs = Math.max(0, Math.round(startTimeMs))
      this.viewportDurationMs = Math.max(0, Math.round(durationMs))
    },
    selectResonator(slotId: ResonatorSlotId) {
      this.activeResonatorSlotId = slotId
    },
  },
})
