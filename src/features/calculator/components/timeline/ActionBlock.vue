<script setup lang="ts">
import type { PlannedAction } from '../../../../domain/combat'

defineProps<{
  action: PlannedAction
  name: string
  left: number
  width: number
  keptWidth: number
  endTimeMs: number
  hitOffsets: number[]
  top: number
  height: number
  selected: boolean
  newlyAdded: boolean
  trimmed: boolean
}>()
defineEmits<{
  select: [id: string]
  dragStart: [event: PointerEvent, action: PlannedAction]
  trimStart: [event: PointerEvent, action: PlannedAction]
}>()
</script>

<template>
  <button
    type="button"
    class="timeline-action"
    :class="{ 'is-selected': selected, 'is-new': newlyAdded, 'is-trimmed': trimmed }"
    :style="{
      left: `${left}px`,
      width: `${width}px`,
      top: `${top}px`,
      height: `${height}px`,
      '--action-height': `${height}px`,
    }"
    :aria-label="name"
    @pointerdown="$emit('dragStart', $event, action)"
    @click="$emit('select', action.id)"
  >
    <span class="action-kept" :style="{ width: `${keptWidth}px` }" />
    <span class="action-tooltip">
      <b>{{ name }}</b>
      <small>
        {{ (action.startTimeMs / 1000).toFixed(3) }}s-{{ (endTimeMs / 1000).toFixed(3) }}s ·
        {{ hitOffsets.length }} Hits
      </small>
    </span>
    <i
      v-for="(offset, index) in hitOffsets"
      :key="index"
      class="timeline-hit"
      :style="{ left: `${offset}px` }"
    />
    <i
      class="trim-handle"
      :style="{ left: `${keptWidth - 4}px` }"
      title="拖动以裁剪动作"
      @pointerdown.stop="$emit('trimStart', $event, action)"
    />
  </button>
</template>
