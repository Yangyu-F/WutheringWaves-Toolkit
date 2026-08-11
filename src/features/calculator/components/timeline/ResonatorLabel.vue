<script setup lang="ts">
import ToolbarIcon from '../shell/ToolbarIcon.vue'
defineProps<{
  label: string
  slotIndex: number
  height: number
  selected: boolean
  image?: string
}>()
defineEmits<{ select: [] }>()
</script>
<template>
  <button
    type="button"
    class="resonator-label"
    :class="[`slot-${slotIndex}`, { 'is-selected': selected }]"
    :style="{ height: `${height}px` }"
    @click="$emit('select')"
  >
    <span class="track-avatar"
      ><img v-if="image" :src="image" alt="" /><ToolbarIcon v-else name="add" /></span
    ><span class="track-character"
      ><strong>{{ label }}</strong></span
    >
  </button>
</template>
