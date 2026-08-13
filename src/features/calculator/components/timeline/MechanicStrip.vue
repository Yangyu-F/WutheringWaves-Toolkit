<script setup lang="ts">
import { computed } from 'vue'
import type { MechanicEvent, ResourcePoint, StatusInterval } from '../../../../domain/combat'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  resourcePoints: ResourcePoint[]
  events: MechanicEvent[]
  statuses: StatusInterval[]
  width: number
  inset: number
  zoomPxPerSecond: number
  height: number
}>()
const { t, te } = useI18n()
const visiblePoints = computed(() => props.resourcePoints.filter((point) => point.change !== 0))
const resourceName = (resourceId: string) => {
  const key = `workspace.resources.${resourceId}`
  return te(key) ? t(key) : resourceId
}
</script>

<template>
  <div class="mechanic-strip" :style="{ width: `${width}px`, height: `${height}px` }">
    <i
      v-for="(point, index) in visiblePoints"
      :key="`${point.resourceId}-${point.timeMs}-${index}`"
      class="mechanic-resource-point ui-tooltip"
      data-tooltip-placement="top"
      :class="{ 'is-cost': point.change < 0 }"
      :style="{ left: `${inset + (point.timeMs / 1000) * zoomPxPerSecond}px` }"
      :data-tooltip="`${resourceName(point.resourceId)} ${point.value}`"
      >{{ point.change > 0 ? `+${point.change}` : point.change }}</i
    >
    <i
      v-for="event in events.filter((item) => item.kind === 'healing')"
      :key="event.id + event.timeMs"
      class="mechanic-healing-point ui-tooltip"
      data-tooltip-placement="top"
      :style="{ left: `${inset + (event.timeMs / 1000) * zoomPxPerSecond}px` }"
      :data-tooltip="`${t('workspace.totalHealing')} ${Math.round(event.value ?? 0)}`"
      >+</i
    >
    <i
      v-for="event in events.filter((item) => item.kind !== 'healing' && item.kind !== 'resource')"
      :key="event.id + event.timeMs"
      class="mechanic-derived-point ui-tooltip"
      data-tooltip-placement="top"
      :style="{ left: `${inset + (event.timeMs / 1000) * zoomPxPerSecond}px` }"
      :data-tooltip="event.label"
    />
    <span
      v-for="status in statuses"
      :key="status.id"
      class="mechanic-status-interval"
      :style="{
        left: `${inset + (status.startTimeMs / 1000) * zoomPxPerSecond}px`,
        width: `${Math.max(12, ((status.endTimeMs - status.startTimeMs) / 1000) * zoomPxPerSecond)}px`,
      }"
      >{{ status.statusId }}</span
    >
  </div>
</template>
