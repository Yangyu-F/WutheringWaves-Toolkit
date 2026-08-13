<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import ProjectWelcome from '../components/projects/ProjectWelcome.vue'
import EditorToolbar from '../components/shell/EditorToolbar.vue'
import ProductInfoDialog from '../components/shell/ProductInfoDialog.vue'
import WorkspaceRail from '../components/shell/WorkspaceRail.vue'
import SkillLibrary from '../components/skills/SkillLibrary.vue'
import EchoLoadoutPanel from '../components/team/EchoLoadoutPanel.vue'
import TeamPanel from '../components/team/TeamPanel.vue'
import TimelineEditor from '../components/timeline/TimelineEditor.vue'
import PanelShell from '../components/ui/PanelShell.vue'
import ScrollRegion from '../components/ui/ScrollRegion.vue'
import UtilityPanel from '../components/utility/UtilityPanel.vue'
import { useCalculatorSimulation } from '../composables/useCalculatorSimulation'
import { useProjectLibraryStore } from '../stores/projectLibrary'
import { useTimelineViewportStore } from '../stores/timelineViewport'
import { useI18n } from 'vue-i18n'

const library = useProjectLibraryStore()
const timelineView = useTimelineViewportStore()
const { t } = useI18n()
const { timelineStore, settings, loadout, result } = useCalculatorSimulation()
const selectedActionId = ref<string>()
const utilityPanel = ref<'inspector' | 'results'>()
const leftPanel = ref<'team' | 'skills' | undefined>('team')
const infoOpen = ref(false)
let saveTimer: ReturnType<typeof setTimeout> | undefined
const selectedWindow = computed(() =>
  result.value.timeline.windows.find((item) => item.actionInstanceId === selectedActionId.value),
)
function removeSelectedAction(id: string) {
  const removed = timelineStore.actions.find((action) => action.id === id)
  if (!removed) return
  const peers = timelineStore.actions
    .filter(
      (action) =>
        action.id !== id &&
        (action.resonatorSlotId ?? 'slot-1') === (removed.resonatorSlotId ?? 'slot-1'),
    )
    .sort((left, right) => left.startTimeMs - right.startTimeMs)
  const next = peers.reduce<(typeof peers)[number] | undefined>((closest, action) => {
    if (!closest) return action
    return Math.abs(action.startTimeMs - removed.startTimeMs) <
      Math.abs(closest.startTimeMs - removed.startTimeMs)
      ? action
      : closest
  }, undefined)
  timelineStore.removeAction(id)
  selectedActionId.value = next?.id
}
function focusDiagnostic(actionId: string, timeMs: number) {
  selectedActionId.value = actionId || undefined
  timelineView.setPlayhead(timeMs, timelineStore.durationMs)
  utilityPanel.value = 'inspector'
}
watchEffect(() => {
  document.title = t('workspace.productName')
})

onMounted(() => {
  void library.initialize()
})
watch(
  [
    () => timelineStore.actions,
    () => timelineStore.switches,
    () => timelineStore.durationMs,
    () => settings,
    () => loadout,
  ],
  () => {
    if (!library.activeProjectId) return
    library.markDirty()
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => library.saveActive(), 600)
  },
  { deep: true },
)
</script>

<template>
  <div v-if="library.loading" class="workspace-loading">{{ t('workspace.loading') }}</div>
  <ProjectWelcome v-else-if="!library.activeProject" />
  <div
    v-else
    class="calculator-workspace"
    :class="{
      'left-panel-closed': leftPanel === undefined,
      'right-panel-closed': utilityPanel === undefined,
    }"
  >
    <EditorToolbar />
    <WorkspaceRail
      side="left"
      :active="leftPanel"
      @select="
        (panel) => (leftPanel = leftPanel === panel ? undefined : (panel as 'team' | 'skills'))
      "
      @info="infoOpen = true"
    />
    <aside v-if="leftPanel" class="workspace-sidebar">
      <PanelShell :title="t(leftPanel === 'team' ? 'workspace.teamMode' : 'workspace.skillMode')">
        <ScrollRegion v-if="leftPanel === 'team'" class="sidebar-mode-content">
          <TeamPanel /><EchoLoadoutPanel />
        </ScrollRegion>
        <ScrollRegion v-else class="sidebar-mode-content"
          ><SkillLibrary
            :resources="result.resourceCurve"
            :diagnostics="result.timeline.diagnostics"
            @request-team="leftPanel = 'team'"
        /></ScrollRegion>
      </PanelShell>
    </aside>
    <main class="workspace-canvas">
      <TimelineEditor
        :windows="result.timeline.windows"
        :hits="result.hits"
        :buffs="result.buffIntervals"
        :resources="result.resourceCurve"
        :mechanic-events="result.mechanicEvents"
        :diagnostics="result.timeline.diagnostics"
        :statuses="result.statusIntervals"
        :selected-action-id="selectedActionId"
        @select="selectedActionId = $event"
      />
    </main>
    <UtilityPanel
      v-if="utilityPanel"
      :active="utilityPanel"
      :result="result"
      :selected-action-id="selectedActionId"
      :natural-end-time-ms="selectedWindow?.naturalEndTimeMs"
      @delete="removeSelectedAction"
      @focus-diagnostic="focusDiagnostic"
    />
    <WorkspaceRail
      side="right"
      :active="utilityPanel"
      @select="
        (panel) =>
          (utilityPanel = utilityPanel === panel ? undefined : (panel as 'inspector' | 'results'))
      "
    />
    <ProductInfoDialog v-if="infoOpen" @close="infoOpen = false" />
  </div>
</template>
