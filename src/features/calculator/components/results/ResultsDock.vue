<script setup lang="ts">
import type { SimulationResult } from '../../../../domain/combat'
import { useI18n } from 'vue-i18n'
defineProps<{ result: SimulationResult }>()
const emit = defineEmits<{ focusDiagnostic: [actionId: string, timeMs: number] }>()
const { t } = useI18n()
const format = (value: number) =>
  new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value)
function diagnosticText(diagnostic: SimulationResult['timeline']['diagnostics'][number]) {
  return t(`workspace.diagnostics.${diagnostic.code}`, {
    time: (diagnostic.timeMs / 1000).toFixed(2),
    actions: diagnostic.actionInstanceIds.join(', '),
    resource: diagnostic.resourceId ? t(`workspace.resources.${diagnostic.resourceId}`) : '',
    required: diagnostic.requiredValue,
    actual: diagnostic.actualValue,
    available: ((diagnostic.availableAtMs ?? 0) / 1000).toFixed(2),
    status: diagnostic.statusId ?? '',
  })
}
</script>
<template>
  <section class="results-content-region">
    <div class="results-content">
      <div class="result-metric">
        <small>{{ t('workspace.totalDamage') }}</small
        ><b>{{ format(result.totalDamage) }}</b>
      </div>
      <div class="result-metric">
        <small>{{ t('workspace.dps') }}</small
        ><b>{{ format(result.dps) }}</b>
      </div>
      <div class="result-metric">
        <small>{{ t('workspace.totalHealing') }}</small
        ><b>{{ format(result.totalHealing) }}</b>
      </div>
      <div class="result-metric">
        <small>{{ t('workspace.hps') }}</small
        ><b>{{ format(result.hps) }}</b>
      </div>
      <div class="result-metric">
        <small>{{ t('workspace.totalShield') }}</small
        ><b>{{ format(result.totalShield) }}</b>
      </div>
      <div v-if="result.healing.length" class="healing-details">
        <small>{{ t('workspace.healingDetails') }}</small>
        <ul>
          <li v-for="event in result.healing" :key="event.id + event.timeMs">
            <span>{{ t(`calculator.actionsMap.${event.sourceActionId}`) }}</span>
            <b>{{ format(event.finalHealing) }}</b>
            <span>{{ t(`workspace.healingTargets.${event.target}`) }}</span>
          </li>
        </ul>
      </div>
      <div v-if="result.shields.length" class="healing-details">
        <small>{{ t('workspace.shieldDetails') }}</small>
        <ul>
          <li v-for="event in result.shields" :key="event.id + event.timeMs">
            <span>{{ t(`calculator.actionsMap.${event.sourceActionId}`) }}</span>
            <b>{{ format(event.finalShield) }}</b>
            <span>{{ t(`workspace.healingTargets.${event.target}`) }}</span>
          </li>
        </ul>
      </div>
      <div class="result-status">
        <span v-if="!result.timeline.diagnostics.length">{{ t('workspace.complete') }}</span>
        <ul v-else>
          <li v-for="(diagnostic, index) in result.timeline.diagnostics" :key="index">
            <button
              type="button"
              @click="
                emit('focusDiagnostic', diagnostic.actionInstanceIds[0] ?? '', diagnostic.timeMs)
              "
            >
              {{ diagnosticText(diagnostic) }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
