<script setup lang="ts">
import { computed } from 'vue'
import type {
  ActionDefinition,
  ActionWindow,
  CompiledHit,
  MechanicEvent,
  PlannedAction,
  ResourcePoint,
  StatusInterval,
  TimelineDiagnostic,
} from '../../../../domain/combat'
import { assignActionLanes } from '../../layout/assignActionLanes'
import {
  ACTION_BLOCK_GAP,
  DEFAULT_ACTION_LANES,
  MECHANIC_TRACK_HEIGHT,
} from '../../layout/timelineDimensions'
import ActionBlock from './ActionBlock.vue'
import MechanicStrip from './MechanicStrip.vue'

const props = defineProps<{
  actions: PlannedAction[]
  windows: ActionWindow[]
  hits: CompiledHit[]
  width: number
  zoomPxPerSecond: number
  selectedActionId?: string
  height: number
  actionNames: Map<string, string>
  slotIndex: number
  viewportStartMs: number
  viewportDurationMs: number
  newActionId?: string
  inset: number
  definitions: Map<string, ActionDefinition>
  diagnostics: TimelineDiagnostic[]
  resourcePoints: ResourcePoint[]
  mechanicEvents: MechanicEvent[]
  statuses: StatusInterval[]
}>()
defineEmits<{
  select: [id: string]
  dragStart: [event: PointerEvent, action: PlannedAction]
  trimStart: [event: PointerEvent, action: PlannedAction]
}>()

const windowFor = (id: string) => props.windows.find((window) => window.actionInstanceId === id)
const lanePlacements = computed(() =>
  assignActionLanes(
    props.actions.map((action) => ({
      id: action.id,
      startTimeMs: action.startTimeMs,
      endTimeMs: windowFor(action.id)?.endTimeMs ?? action.startTimeMs,
    })),
  ),
)
const laneFor = (id: string) =>
  lanePlacements.value.find((item) => item.actionId === id)?.laneIndex ?? 0
const laneCount = computed(() =>
  Math.max(
    DEFAULT_ACTION_LANES,
    Math.max(-1, ...lanePlacements.value.map((item) => item.laneIndex)) + 1,
  ),
)
const laneHeight = computed(() => (props.height - MECHANIC_TRACK_HEIGHT) / laneCount.value)
const visibleActions = computed(() => {
  const minimum = props.viewportStartMs - 1_000
  const maximum = props.viewportStartMs + props.viewportDurationMs + 1_000
  return props.actions.filter((action) => {
    const window = windowFor(action.id)
    return (window?.endTimeMs ?? action.startTimeMs) >= minimum && action.startTimeMs <= maximum
  })
})
</script>

<template>
  <div
    class="resonator-track"
    :class="`slot-${slotIndex}`"
    :style="{ width: `${width}px`, height: `${height}px` }"
  >
    <ActionBlock
      v-for="action in visibleActions"
      :key="action.id"
      :action="action"
      :name="actionNames.get(action.actionId) ?? action.actionId"
      :left="inset + (action.startTimeMs / 1000) * zoomPxPerSecond"
      :width="
        Math.max(
          2,
          (((windowFor(action.id)?.naturalEndTimeMs ?? action.startTimeMs) - action.startTimeMs) /
            1000) *
            zoomPxPerSecond,
        )
      "
      :kept-width="
        Math.max(
          2,
          (((windowFor(action.id)?.endTimeMs ?? action.startTimeMs) - action.startTimeMs) / 1000) *
            zoomPxPerSecond,
        )
      "
      :end-time-ms="windowFor(action.id)?.endTimeMs ?? action.startTimeMs"
      :hit-offsets="
        hits
          .filter((hit) => hit.actionInstanceId === action.id)
          .map((hit) => ((hit.timeMs - action.startTimeMs) / 1000) * zoomPxPerSecond)
      "
      :top="laneFor(action.id) * laneHeight + ACTION_BLOCK_GAP / 2"
      :height="Math.max(8, laneHeight - ACTION_BLOCK_GAP)"
      :selected="selectedActionId === action.id"
      :newly-added="newActionId === action.id"
      :trimmed="windowFor(action.id)?.trimmed ?? false"
      :resource-change="
        (definitions.get(action.actionId)?.resourceChanges ?? []).reduce(
          (total, change) => total + change.amount,
          0,
        )
      "
      :has-healing="Boolean(definitions.get(action.actionId)?.healing?.length)"
      :warning="diagnostics.some((item) => item.actionInstanceIds.includes(action.id))"
      @select="$emit('select', $event)"
      @drag-start="(event, item) => $emit('dragStart', event, item)"
      @trim-start="(event, item) => $emit('trimStart', event, item)"
    />
    <MechanicStrip
      :resource-points="resourcePoints"
      :events="mechanicEvents"
      :statuses="statuses"
      :width="width"
      :inset="inset"
      :zoom-px-per-second="zoomPxPerSecond"
      :height="MECHANIC_TRACK_HEIGHT"
    />
  </div>
</template>
