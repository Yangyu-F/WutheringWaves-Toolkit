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
const effectName = (id: string) => t(`workspace.effectNames.${id}`)
const labels = [
  () => t('workspace.yangyangBuff'),
  () => t('workspace.slotBuff', { slot: 2 }),
  () => t('workspace.slotBuff', { slot: 3 }),
  () => t('workspace.teamBuff'),
  () => t('workspace.enemyDebuff'),
]
function allGroupBuffs(groupId: string) {
  const matching = props.buffs
    .filter((buff) => buff.targetTrack === groupId)
    .sort((left, right) => left.startTimeMs - right.startTimeMs)
  const merged: BuffInterval[] = []
  for (const buff of matching) {
    const previous = merged[merged.length - 1]
    if (
      previous &&
      previous.id === buff.id &&
      previous.sourceActionId === buff.sourceActionId &&
      previous.endTimeMs >= buff.startTimeMs
    ) {
      previous.endTimeMs = Math.max(previous.endTimeMs, buff.endTimeMs)
      previous.stacks = Math.max(previous.stacks, buff.stacks)
    } else merged.push({ ...buff })
  }
  return merged
}
function visibleGroupBuffs(groupId: string) {
  const minimum = props.viewportStartMs - 1_000
  const maximum = props.viewportStartMs + props.viewportDurationMs + 1_000
  return allGroupBuffs(groupId).filter(
    (buff) => buff.endTimeMs >= minimum && buff.startTimeMs <= maximum,
  )
}
function placements(groupId: string) {
  return assignActionLanes(
    allGroupBuffs(groupId).map((buff, index) => ({
      id: `${buff.id}-${index}`,
      startTimeMs: buff.startTimeMs,
      endTimeMs: buff.endTimeMs,
    })),
  )
}
function laneFor(groupId: string, index: number) {
  const buff = visibleGroupBuffs(groupId)[index]
  const allIndex = allGroupBuffs(groupId).findIndex(
    (item) =>
      item.id === buff?.id &&
      item.sourceActionId === buff?.sourceActionId &&
      item.startTimeMs === buff?.startTimeMs,
  )
  return (
    placements(groupId).find((item) => item.actionId === `${buff?.id}-${allIndex}`)?.laneIndex ?? 0
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
        <template v-if="visibleGroupBuffs(group.id).length">
          <span
            v-for="(buff, index) in visibleGroupBuffs(group.id)"
            :key="buff.id + index"
            :style="{
              left: `${inset + (buff.startTimeMs / 1000) * zoomPxPerSecond}px`,
              width: `${Math.max(12, ((buff.endTimeMs - buff.startTimeMs) / 1000) * zoomPxPerSecond)}px`,
              top: `${2 + laneFor(group.id, index) * buffHeight}px`,
              height: `${buffHeight}px`,
            }"
            ><b>{{ effectName(buff.id) }}</b
            ><small>{{ ((buff.endTimeMs - buff.startTimeMs) / 1000).toFixed(1) }}s</small></span
          >
        </template>
      </div>
    </div>
  </div>
</template>
