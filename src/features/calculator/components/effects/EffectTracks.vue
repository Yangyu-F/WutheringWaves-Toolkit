<script setup lang="ts">
import { computed } from 'vue'
import type { BuffInterval } from '../../../../domain/combat'
import { assignActionLanes } from '../../layout/assignActionLanes'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  buffs: BuffInterval[]
  width: number
  zoomPxPerSecond: number
  buffHeight: number
  viewportStartMs: number
  viewportDurationMs: number
  inset: number
}>()
const groups = [
  { id: 'slot-1', tone: 'buff' },
  { id: 'slot-2', tone: 'buff' },
  { id: 'slot-3', tone: 'buff' },
  { id: 'team', tone: 'team' },
  { id: 'enemy', tone: 'debuff' },
] as const
const { t } = useI18n()
const labels = [
  () => t('workspace.yangyangBuff'),
  () => t('workspace.slotBuff', { slot: 2 }),
  () => t('workspace.slotBuff', { slot: 3 }),
  () => t('workspace.teamBuff'),
  () => t('workspace.enemyDebuff'),
]
function groupBuffs(groupId: string) {
  const minimum = props.viewportStartMs - 1_000
  const maximum = props.viewportStartMs + props.viewportDurationMs + 1_000
  return props.buffs.filter(
    (buff) =>
      buff.targetTrack === groupId && buff.endTimeMs >= minimum && buff.startTimeMs <= maximum,
  )
}
function placements(groupId: string) {
  return assignActionLanes(
    groupBuffs(groupId).map((buff, index) => ({
      id: `${buff.id}-${index}`,
      startTimeMs: buff.startTimeMs,
      endTimeMs: buff.endTimeMs,
    })),
  )
}
function laneFor(groupId: string, index: number) {
  return (
    placements(groupId).find(
      (item) => item.actionId === `${groupBuffs(groupId)[index]?.id}-${index}`,
    )?.laneIndex ?? 0
  )
}
const rowHeights = computed(() =>
  Object.fromEntries(
    groups.map((group) => {
      const laneCount = Math.max(
        1,
        Math.max(-1, ...placements(group.id).map((item) => item.laneIndex)) + 1,
      )
      return [group.id, laneCount * props.buffHeight + 4]
    }),
  ),
)
</script>

<template>
  <div class="effect-tracks">
    <div
      v-for="(group, groupIndex) in groups"
      :key="group.id"
      class="effect-track-pair"
      :class="{ 'is-first': groupIndex === 0 }"
    >
      <div class="effect-label" :style="{ height: `${rowHeights[group.id]}px` }">
        {{ labels[groupIndex]?.() }}
      </div>
      <div
        class="effect-row"
        :class="[`is-${group.tone}`, `group-${group.id}`]"
        :style="{ width: `${width}px`, height: `${rowHeights[group.id]}px` }"
      >
        <template v-if="groupBuffs(group.id).length">
          <span
            v-for="(buff, index) in groupBuffs(group.id)"
            :key="buff.id + index"
            :style="{
              left: `${inset + (buff.startTimeMs / 1000) * zoomPxPerSecond}px`,
              width: `${Math.max(12, ((buff.endTimeMs - buff.startTimeMs) / 1000) * zoomPxPerSecond)}px`,
              top: `${2 + laneFor(group.id, index) * buffHeight}px`,
              height: `${buffHeight}px`,
            }"
            ><b>{{ buff.id }}</b
            ><small>{{ ((buff.endTimeMs - buff.startTimeMs) / 1000).toFixed(1) }}s</small></span
          >
        </template>
        <p v-if="!groupBuffs(group.id).length">
          {{ t('workspace.noEffect') }}
        </p>
      </div>
    </div>
  </div>
</template>
