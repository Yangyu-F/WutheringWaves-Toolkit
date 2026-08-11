<script setup lang="ts">
import type { SimulationResult } from '../../../../domain/combat'
import { useI18n } from 'vue-i18n'
defineProps<{ result: SimulationResult }>()
const { t } = useI18n()
const format = (value: number) =>
  new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value)
function diagnosticText(code: 'unknown-action' | 'invalid-trim', timeMs: number, ids: string[]) {
  return t(`workspace.diagnostics.${code}`, {
    time: (timeMs / 1000).toFixed(2),
    actions: ids.join(', '),
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
      <div class="result-status">
        <span v-if="!result.timeline.diagnostics.length">{{ t('workspace.complete') }}</span>
        <ul v-else>
          <li v-for="(diagnostic, index) in result.timeline.diagnostics" :key="index">
            {{ diagnosticText(diagnostic.code, diagnostic.timeMs, diagnostic.actionInstanceIds) }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
