<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectMenu from '../ui/SelectMenu.vue'
import ToolbarField from '../ui/ToolbarField.vue'
const props = defineProps<{ durationSeconds: number; zoomPxPerSecond: number }>()
const emit = defineEmits<{
  'update:durationSeconds': [value: number]
  'update:zoomPxPerSecond': [value: number]
  fit: []
}>()
const { t } = useI18n()
const zoomSlider = computed(() =>
  Math.round((Math.log(props.zoomPxPerSecond) / Math.log(800)) * 1000),
)
const zoomProgress = computed(() => `${zoomSlider.value / 10}%`)
function updateZoom(rawValue: string) {
  emit('update:zoomPxPerSecond', Math.max(1, Math.round(800 ** (Number(rawValue) / 1000))))
}
const durationOptions = [30, 60, 120].map((value) => ({ label: `${value}s`, value }))
</script>
<template>
  <header class="timeline-tools">
    <div>
      <strong>{{ t('workspace.timeline') }}</strong>
    </div>
    <ToolbarField :label="t('workspace.duration')" class="timeline-field">
      <SelectMenu
        class="timeline-duration"
        :model-value="durationSeconds"
        :options="durationOptions"
        :label="t('workspace.duration')"
        @update:model-value="emit('update:durationSeconds', Number($event))"
      />
    </ToolbarField>
    <ToolbarField :label="t('workspace.zoom')"
      ><span class="zoom-control">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
        <input
          :value="zoomSlider"
          :style="{ '--zoom-progress': zoomProgress }"
          type="range"
          min="0"
          max="1000"
          step="1"
          @dblclick="emit('update:zoomPxPerSecond', 80)"
          @input="updateZoom(($event.target as HTMLInputElement).value)"
        />
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M8 3v10" /></svg>
      </span>
      <output>{{ zoomPxPerSecond }} px/s</output></ToolbarField
    >
    <button class="fit-timeline" type="button" @click="emit('fit')">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2.5 5V2.5H5M11 2.5h2.5V5M13.5 11v2.5H11M5 13.5H2.5V11" />
        <path d="M5 8h6" />
      </svg>
      <span>{{ t('workspace.fitTimeline') }}</span>
    </button>
  </header>
</template>
