<script setup lang="ts">
import type { SimulationResult } from '../../../../domain/combat'
import { useI18n } from 'vue-i18n'
import InspectorPanel from '../inspector/InspectorPanel.vue'
import ResultsDock from '../results/ResultsDock.vue'
import PanelShell from '../ui/PanelShell.vue'
import ScrollRegion from '../ui/ScrollRegion.vue'

defineProps<{
  active: 'inspector' | 'results'
  result: SimulationResult
  selectedActionId?: string
  naturalEndTimeMs?: number
}>()
const emit = defineEmits<{
  delete: [id: string]
  focusDiagnostic: [actionId: string, timeMs: number]
}>()
const { t } = useI18n()
</script>

<template>
  <aside class="utility-panel">
    <PanelShell :title="t(active === 'inspector' ? 'workspace.inspector' : 'workspace.results')">
      <ScrollRegion>
        <InspectorPanel
          v-if="active === 'inspector'"
          :selected-action-id="selectedActionId"
          :natural-end-time-ms="naturalEndTimeMs"
          @delete="emit('delete', $event)"
        />
        <ResultsDock
          v-else
          :result="result"
          @focus-diagnostic="(actionId, timeMs) => emit('focusDiagnostic', actionId, timeMs)"
        />
      </ScrollRegion>
    </PanelShell>
  </aside>
</template>
