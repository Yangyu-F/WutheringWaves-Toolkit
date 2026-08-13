<script setup lang="ts">
import { useCalculatorProjectStore } from '../../stores/project'
import { useTimelineViewportStore } from '../../stores/timelineViewport'
import yangyangIcon from '../../../../assets/game/characters/yangyang.webp'
import weaponIcon from '../../../../assets/game/weapons/qiangu-fuliu.webp'
import echoIcon from '../../../../assets/game/echoes/feilian-zhixing.webp'
import { useI18n } from 'vue-i18n'
import NumericField from '../ui/NumericField.vue'
import ToolbarIcon from '../shell/ToolbarIcon.vue'

const project = useCalculatorProjectStore()
const view = useTimelineViewportStore()
const { t } = useI18n()
</script>

<template>
  <section class="side-section">
    <header>
      <h2>{{ t('workspace.team') }}</h2>
    </header>
    <article
      class="team-slot is-active"
      :class="{ 'is-selected': view.activeResonatorSlotId === 'slot-1' }"
      @click="view.selectResonator('slot-1')"
    >
      <img :src="yangyangIcon" alt="秧秧" />
      <div><strong>秧秧</strong><small>气动 · 迅刀</small></div>
      <b>01</b>
      <figure>
        <img :src="weaponIcon" alt="千古洑流" /><img :src="echoIcon" alt="飞廉之猩" />
      </figure>
      <label
        >{{ t('workspace.resonanceChain')
        }}<select v-model.number="project.settings.resonanceChain">
          <option v-for="value in 7" :key="value" :value="value - 1">{{ value - 1 }}</option>
        </select></label
      >
      <label
        >{{ t('workspace.weaponRank')
        }}<select v-model.number="project.settings.weaponRefinement">
          <option v-for="value in 5" :key="value" :value="value">{{ value }}</option>
        </select></label
      >
      <label
        >{{ t('workspace.initialLiuxiang')
        }}<select v-model.number="project.settings.initialLiuxiang">
          <option v-for="value in 4" :key="value" :value="value - 1">{{ value - 1 }}</option>
        </select></label
      >
    </article>
    <button
      v-for="slot in [2, 3]"
      :key="slot"
      type="button"
      class="team-slot is-empty"
      :class="{ 'is-selected': view.activeResonatorSlotId === `slot-${slot}` }"
      @click="view.selectResonator(`slot-${slot}` as 'slot-2' | 'slot-3')"
    >
      <b>0{{ slot }}</b
      ><ToolbarIcon name="add" /><span>{{ t('workspace.addResonator') }}</span>
    </button>
  </section>
  <section class="side-section enemy-panel">
    <header>
      <h2>{{ t('workspace.enemy') }}</h2>
    </header>
    <div>
      <NumericField
        v-model="project.settings.enemyLevel"
        :label="t('workspace.level')"
        :min="1"
        :max="200"
      />
      <NumericField
        v-model="project.settings.aeroResistancePercent"
        :label="t('workspace.aeroResistance')"
        :step="0.1"
        unit="%"
      />
    </div>
    <label
      >{{ t('workspace.criticalMode')
      }}<select v-model="project.settings.criticalMode">
        <option value="expected">{{ t('workspace.expected') }}</option>
        <option value="critical">{{ t('workspace.critical') }}</option>
        <option value="normal">{{ t('workspace.normal') }}</option>
      </select></label
    >
  </section>
</template>
