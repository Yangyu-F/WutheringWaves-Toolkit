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
const ticks = computed(() => {
  const first = Math.max(0, Math.floor((props.viewportStartMs - 1_000) / 500))
  const last = Math.min(
    Math.floor(props.durationMs / 500),
    Math.ceil((props.viewportStartMs + props.viewportDurationMs + 1_000) / 500),
  )
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index)
})
</script>

<template>
  <div class="timeline-ruler" :style="{ width: `${width}px` }">
    <span
      v-for="tick in ticks"
      :key="tick"
      :class="{ 'is-half-second': tick % 2 === 1 }"
      :style="{ left: `${inset + (tick * zoomPxPerSecond) / 2}px` }"
      >{{ tick % 2 === 0 ? `${tick / 2}s` : '' }}</span
    >
  </div>
</template>
