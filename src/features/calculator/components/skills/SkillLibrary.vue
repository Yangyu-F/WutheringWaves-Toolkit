<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { yangyangActions } from '../../../../data/versions/v3_5/phaseOne'
import type { ActionDefinition } from '../../../../domain/combat'
import { useTimelineStore } from '../../stores/timeline'
import { useTimelineViewportStore } from '../../stores/timelineViewport'
import { useI18n } from 'vue-i18n'
import EmptyState from '../ui/EmptyState.vue'

const timeline = useTimelineStore()
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
      <button
        v-for="skill in skills"
        :key="skill.id"
        type="button"
        :class="{ 'is-added': addedSkillId === skill.id }"
        @click="addSkill(skill)"
      >
        <span
          ><strong>{{ shortName(skill.name) }}</strong
          ><small>{{ t('workspace.hits', { count: skill.hits.length }) }}</small></span
        >
      </button>
      <p v-if="!skills.length">{{ t('workspace.emptyCategory') }}</p>
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
