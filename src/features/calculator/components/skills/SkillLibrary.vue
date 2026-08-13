<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { yangyangActions } from '../../../../data/versions/v3_5/phaseOne'
import type { ActionDefinition, ResourcePoint, TimelineDiagnostic } from '../../../../domain/combat'
import { useTimelineStore } from '../../stores/timeline'
import { useTimelineViewportStore } from '../../stores/timelineViewport'
import { useI18n } from 'vue-i18n'
import EmptyState from '../ui/EmptyState.vue'

const timeline = useTimelineStore()
const props = defineProps<{ resources: ResourcePoint[]; diagnostics: TimelineDiagnostic[] }>()
const emit = defineEmits<{ requestTeam: [] }>()
const view = useTimelineViewportStore()
const { t } = useI18n()
const active = ref('basic')
const addedSkillId = ref<string>()
let feedbackTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(feedbackTimer))
const categories = [
  ['basic', '常态'],
  ['skill', '技能'],
  ['circuit', '回路'],
  ['liberation', '解放'],
  ['intro', '变奏'],
  ['outro', '延奏'],
  ['tune', '谐度'],
  ['echo', '声骸'],
] as const
function matches(action: ActionDefinition, category: string) {
  const prefixes: Record<string, string> = {
    basic: '常态攻击',
    skill: '共鸣技能',
    circuit: '共鸣回路',
    liberation: '共鸣解放',
    intro: '变奏技能',
    outro: '延奏技能',
    tune: '谐度破坏',
  }
  return category === 'echo'
    ? action.damageType === 'echo'
    : action.name.startsWith(prefixes[category] ?? '')
}
const skills = computed(() => yangyangActions.filter((action) => matches(action, active.value)))
const isConfigured = computed(() => view.activeResonatorSlotId === 'slot-1')
const shortName = (name: string) => name.split('·').slice(-1)[0] ?? name
const currentLiuxiang = computed(() => {
  const points = props.resources
    .filter(
      (point) =>
        point.resonatorSlotId === view.activeResonatorSlotId &&
        point.resourceId === 'liuxiang' &&
        point.timeMs <= view.playheadMs,
    )
    .sort((left, right) => left.timeMs - right.timeMs)
  return points[points.length - 1]?.value ?? 0
})
const currentActiveSlotId = computed(() => {
  const switches = timeline.switches
    .filter((event) => event.timeMs <= view.playheadMs)
    .sort((left, right) => left.timeMs - right.timeMs)
  return switches[switches.length - 1]?.toSlotId ?? 'slot-1'
})
function unavailableReason(skill: ActionDefinition) {
  const requirement = skill.resourceRequirements?.find(
    (item) => item.resourceId === 'liuxiang' && currentLiuxiang.value < item.minimumValue,
  )
  if (requirement)
    return t('workspace.requiresResource', {
      value: requirement.minimumValue,
      resource: t('workspace.resources.liuxiang'),
    })
  const previous = [...timeline.actions]
    .filter(
      (action) =>
        action.actionId === skill.id &&
        (action.resonatorSlotId ?? 'slot-1') === view.activeResonatorSlotId &&
        action.startTimeMs <= view.playheadMs,
    )
    .sort((left, right) => right.startTimeMs - left.startTimeMs)[0]
  if (previous && skill.cooldownMs && previous.startTimeMs + skill.cooldownMs > view.playheadMs)
    return t('workspace.cooldownUntil', {
      time: ((previous.startTimeMs + skill.cooldownMs) / 1000).toFixed(2),
    })
  return ''
}
function addSkill(skill: ActionDefinition) {
  timeline.addActionToViewport(
    skill.id,
    view.activeResonatorSlotId,
    view.viewportStartMs,
    view.viewportDurationMs,
  )
  addedSkillId.value = skill.id
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => (addedSkillId.value = undefined), 360)
}
</script>

<template>
  <section class="side-section skill-library">
    <nav v-if="isConfigured">
      <button
        v-for="category in categories"
        :key="category[0]"
        type="button"
        :class="{ 'is-active': active === category[0] }"
        @click="active = category[0]"
      >
        {{ t(`workspace.categories.${category[0]}`) }}
      </button>
    </nav>
    <div v-if="isConfigured" class="skill-list">
      <p class="skill-state-summary">
        {{ (view.playheadMs / 1000).toFixed(3) }}s · {{ t('workspace.resources.liuxiang') }}
        {{ currentLiuxiang }}/3
      </p>
      <button
        class="skill-switch-button"
        type="button"
        :disabled="currentActiveSlotId === view.activeResonatorSlotId"
        @click="timeline.addSwitch(view.activeResonatorSlotId, view.playheadMs)"
      >
        <span
          ><strong>{{ t('workspace.switchToSelected') }}</strong
          ><small>{{
            t('workspace.currentActiveSlot', { slot: currentActiveSlotId.slice(-1) })
          }}</small></span
        >
      </button>
      <button
        v-for="skill in skills"
        :key="skill.id"
        type="button"
        :class="{ 'is-added': addedSkillId === skill.id, 'has-warning': unavailableReason(skill) }"
        @click="addSkill(skill)"
      >
        <span
          ><strong>{{ shortName(skill.name) }}</strong
          ><small>{{
            unavailableReason(skill) || t('workspace.hits', { count: skill.hits.length })
          }}</small></span
        >
      </button>
    </div>
    <EmptyState
      v-else
      :text="t('workspace.selectConfigured')"
      :action="t('workspace.teamMode')"
      icon="skills"
      @action="emit('requestTeam')"
    />
  </section>
</template>
