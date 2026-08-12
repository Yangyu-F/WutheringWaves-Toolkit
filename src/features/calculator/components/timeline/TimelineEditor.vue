<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import yangyangIcon from '../../../../assets/game/characters/yangyang.webp'
import { yangyangActions } from '../../../../data/versions/v3_5/phaseOne'
import type { ActionWindow, BuffInterval, CompiledHit } from '../../../../domain/combat'
import { assignActionLanes } from '../../layout/assignActionLanes'
import { useTimelineStore } from '../../stores/timeline'
import { useTimelineViewportStore, type ResonatorSlotId } from '../../stores/timelineViewport'
import EffectTracks from '../effects/EffectTracks.vue'
import CustomScrollArea from '../ui/CustomScrollArea.vue'
import EffectsSummary from './EffectsSummary.vue'
import ResonatorLabel from './ResonatorLabel.vue'
import ResonatorTrack from './ResonatorTrack.vue'
import TimelineControls from './TimelineControls.vue'
import TimelineRuler from './TimelineRuler.vue'
import { useTimelineActionPointer } from './composables/useTimelineActionPointer'
import { closestPeer, useTimelineKeyboard } from './composables/useTimelineKeyboard'
import { useTimelinePlayhead } from './composables/useTimelinePlayhead'
import { TIMELINE_INSET, useTimelineViewport } from './composables/useTimelineViewport'

const props = defineProps<{
  windows: ActionWindow[]
  hits: CompiledHit[]
  buffs: BuffInterval[]
  selectedActionId?: string
}>()
const emit = defineEmits<{ select: [id?: string] }>()
const timeline = useTimelineStore()
const view = useTimelineViewportStore()
const { t } = useI18n()
const buffsCollapsed = ref(localStorage.getItem('wuwa-calculator:buffs-collapsed') === 'true')
let messageTimer: ReturnType<typeof setTimeout> | undefined
let addedHighlightTimer: ReturnType<typeof setTimeout> | undefined

const {
  viewport,
  width,
  baseActionHeight,
  updateViewportMetrics,
  setZoom,
  fitTimeline,
  handleWheel,
} = useTimelineViewport(() => props.windows)
const { playheadMs, playheadDragging, pointerTime, setPlayheadFromPointer, beginPlayheadDrag } =
  useTimelinePlayhead(viewport)
const { beginDrag, beginTrim } = useTimelineActionPointer(
  () => props.windows,
  playheadMs,
  pointerTime,
)

const durationSeconds = computed({
  get: () => timeline.durationMs / 1000,
  set: (value: number) => {
    timeline.durationMs = Math.min(120, Math.max(30, Math.round(value))) * 1000
    playheadMs.value = Math.min(playheadMs.value, timeline.durationMs)
    void setZoom(view.zoomPxPerSecond, playheadMs.value)
  },
})
const actionNames = new Map(yangyangActions.map((action) => [action.id, action.name]))
const labels = computed(() => [
  t('calculator.yangyang'),
  `${t('calculator.resonator')} 2`,
  `${t('calculator.resonator')} 3`,
])

function slotActions(slot: number) {
  return timeline.actions.filter(
    (action) => (action.resonatorSlotId ?? 'slot-1') === `slot-${slot}`,
  )
}
function slotHeight(slot: number) {
  const placements = assignActionLanes(
    slotActions(slot).map((action) => ({
      id: action.id,
      startTimeMs: action.startTimeMs,
      endTimeMs:
        props.windows.find((item) => item.actionInstanceId === action.id)?.endTimeMs ??
        action.startTimeMs,
    })),
  )
  const laneCount = Math.max(3, Math.max(-1, ...placements.map((item) => item.laneIndex)) + 1)
  return baseActionHeight.value * laneCount
}
function toggleBuffs() {
  buffsCollapsed.value = !buffsCollapsed.value
  localStorage.setItem('wuwa-calculator:buffs-collapsed', String(buffsCollapsed.value))
}
function selectAfterRemoval(id: string) {
  const removed = timeline.actions.find((action) => action.id === id)
  if (!removed) return
  const next = closestPeer(timeline.actions, removed)
  timeline.removeAction(id)
  emit('select', next?.id)
}
const { handleTimelineKeydown } = useTimelineKeyboard(
  viewport,
  () => props.selectedActionId,
  selectAfterRemoval,
  (zoom) => setZoom(zoom, playheadMs.value),
  updateViewportMetrics,
)

watch(
  () => timeline.lastAddedActionId,
  (id) => {
    clearTimeout(addedHighlightTimer)
    if (!id) return
    emit('select', id)
    addedHighlightTimer = setTimeout(() => (timeline.lastAddedActionId = ''), 1_000)
  },
)
watch(
  () => timeline.operationMessage,
  (message) => {
    clearTimeout(messageTimer)
    if (message) messageTimer = setTimeout(() => (timeline.operationMessage = ''), 2_800)
  },
)
onBeforeUnmount(() => {
  clearTimeout(messageTimer)
  clearTimeout(addedHighlightTimer)
})
</script>

<template>
  <section class="timeline-editor">
    <TimelineControls
      v-model:duration-seconds="durationSeconds"
      :zoom-px-per-second="view.zoomPxPerSecond"
      @update:zoom-px-per-second="
        (value) => {
          void setZoom(value, playheadMs)
        }
      "
      @fit="fitTimeline"
    />
    <div class="timeline-body">
      <CustomScrollArea
        root-class="timeline-scroll-area"
        viewport-class="timeline-viewport"
        tabindex="0"
        :style="{ '--second-width': `${view.zoomPxPerSecond}px` }"
        @ready="viewport = $event"
        @pointerdown.self="emit('select', undefined)"
        @scroll="updateViewportMetrics"
        @wheel="handleWheel($event, playheadMs)"
        @keydown="handleTimelineKeydown"
      >
        <div
          class="timeline-grid"
          :style="{
            '--timeline-width': `${width + TIMELINE_INSET}px`,
            '--playhead-x': `${(playheadMs / 1000) * view.zoomPxPerSecond}px`,
            '--timeline-inset': `${TIMELINE_INSET}px`,
          }"
          @pointerdown="setPlayheadFromPointer"
        >
          <div class="ruler-spacer">{{ t('workspace.track') }}</div>
          <TimelineRuler
            :duration-ms="timeline.durationMs"
            :zoom-px-per-second="view.zoomPxPerSecond"
            :width="width + TIMELINE_INSET"
            :inset="TIMELINE_INSET"
            :viewport-start-ms="view.viewportStartMs"
            :viewport-duration-ms="view.viewportDurationMs"
          />
          <template v-for="(label, index) in labels" :key="label">
            <ResonatorLabel
              :slot-index="index + 1"
              :label="label"
              :height="slotHeight(index + 1)"
              :selected="view.activeResonatorSlotId === `slot-${index + 1}`"
              :image="index === 0 ? yangyangIcon : undefined"
              @select="view.selectResonator(`slot-${index + 1}` as ResonatorSlotId)"
            />
            <ResonatorTrack
              :actions="slotActions(index + 1)"
              :windows="windows"
              :hits="
                hits.filter((hit) =>
                  slotActions(index + 1).some((action) => action.id === hit.actionInstanceId),
                )
              "
              :width="width + TIMELINE_INSET"
              :inset="TIMELINE_INSET"
              :height="slotHeight(index + 1)"
              :zoom-px-per-second="view.zoomPxPerSecond"
              :selected-action-id="selectedActionId"
              :action-names="actionNames"
              :slot-index="index + 1"
              :viewport-start-ms="view.viewportStartMs"
              :viewport-duration-ms="view.viewportDurationMs"
              :new-action-id="timeline.lastAddedActionId"
              @select="emit('select', $event)"
              @drag-start="beginDrag"
              @trim-start="beginTrim"
            />
          </template>
          <EffectsSummary
            :label="t('workspace.buffs')"
            :collapsed="buffsCollapsed"
            @toggle="toggleBuffs"
          />
          <EffectTracks
            v-if="!buffsCollapsed"
            :buffs="buffs"
            :width="width + TIMELINE_INSET"
            :inset="TIMELINE_INSET"
            :zoom-px-per-second="view.zoomPxPerSecond"
            :buff-height="baseActionHeight / 2"
            :viewport-start-ms="view.viewportStartMs"
            :viewport-duration-ms="view.viewportDurationMs"
          />
          <button
            class="timeline-playhead"
            :class="{ 'is-dragging': playheadDragging }"
            type="button"
            :aria-label="`${(playheadMs / 1000).toFixed(3)}s`"
            :title="`${(playheadMs / 1000).toFixed(3)}s`"
            @pointerdown.stop="beginPlayheadDrag"
          >
            <span>{{ (playheadMs / 1000).toFixed(3) }}s</span>
          </button>
        </div>
      </CustomScrollArea>
      <p v-if="timeline.operationMessage" class="timeline-message" role="status">
        {{ t(`workspace.operationMessages.${timeline.operationMessage}`) }}
      </p>
    </div>
  </section>
</template>
