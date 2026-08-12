<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  durationMs: number
  zoomPxPerSecond: number
  width: number
  viewportStartMs: number
  viewportDurationMs: number
  inset: number
}>()
const tickStepMs = computed(() => {
  if (props.zoomPxPerSecond >= 48) return 500
  if (props.zoomPxPerSecond >= 18) return 1_000
  if (props.zoomPxPerSecond >= 8) return 2_000
  return 5_000
})
const labelStepMs = computed(() => {
  if (props.zoomPxPerSecond >= 64) return 1_000
  if (props.zoomPxPerSecond >= 32) return 2_000
  if (props.zoomPxPerSecond >= 14) return 5_000
  return 10_000
})
const ticks = computed(() => {
  const step = tickStepMs.value
  const first = Math.max(0, Math.floor((props.viewportStartMs - step) / step) * step)
  const last = Math.min(
    props.durationMs,
    Math.ceil((props.viewportStartMs + props.viewportDurationMs + step) / step) * step,
  )
  return Array.from({ length: Math.max(0, Math.floor((last - first) / step) + 1) }, (_, index) => {
    const timeMs = first + index * step
    return {
      timeMs,
      isHalfSecond: timeMs % 1_000 !== 0,
      label: timeMs % labelStepMs.value === 0 ? `${timeMs / 1_000}s` : '',
    }
  })
})
</script>

<template>
  <div class="timeline-ruler" :style="{ width: `${width}px` }">
    <span
      v-for="tick in ticks"
      :key="tick.timeMs"
      :class="{ 'is-half-second': tick.isHalfSecond, 'is-labeled': tick.label }"
      :style="{ left: `${inset + (tick.timeMs / 1_000) * zoomPxPerSecond}px` }"
      >{{ tick.label }}</span
    >
  </div>
</template>
