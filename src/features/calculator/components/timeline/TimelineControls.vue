<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ToolbarField from '../ui/ToolbarField.vue'
defineProps<{ durationSeconds: number; zoomPxPerSecond: number }>()
const emit = defineEmits<{
  'update:durationSeconds': [value: number]
  'update:zoomPxPerSecond': [value: number]
  fit: []
}>()
const { t } = useI18n()
</script>
<template>
  <header class="timeline-tools">
    <div>
      <strong>{{ t('workspace.timeline') }}</strong>
    </div>
    <ToolbarField :label="t('workspace.duration')" class="timeline-field"
      ><select
        :value="durationSeconds"
        class="timeline-duration"
        @change="emit('update:durationSeconds', Number(($event.target as HTMLSelectElement).value))"
      >
        <option :value="30">30s</option>
        <option :value="60">60s</option>
        <option :value="120">120s</option>
      </select></ToolbarField
    >
    <ToolbarField :label="t('workspace.zoom')"
      ><input
        :value="zoomPxPerSecond"
        type="range"
        min="1"
        max="800"
        step="1"
        @input="emit('update:zoomPxPerSecond', Number(($event.target as HTMLInputElement).value))"
      /><output>{{ zoomPxPerSecond }} px/s</output></ToolbarField
    >
    <button class="fit-timeline" type="button" @click="emit('fit')">
      {{ t('workspace.fitTimeline') }}
    </button>
  </header>
</template>
