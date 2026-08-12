<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjectLibraryStore } from '../../stores/projectLibrary'
import ToolbarIcon from './ToolbarIcon.vue'

const library = useProjectLibraryStore()
const { t } = useI18n()
const root = ref<HTMLDetailsElement>()
async function selectProject(id: string) {
  if (id !== library.activeProjectId) {
    await library.saveActive()
    if (library.saveStatus === 'error') return
    await library.openProject(id)
  }
  close()
}
function close() {
  if (root.value) root.value.open = false
}
function closeFromOutside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) close()
}
onMounted(() => document.addEventListener('pointerdown', closeFromOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeFromOutside))
</script>

<template>
  <details ref="root" class="project-switcher" @keydown.esc="close">
    <summary
      :data-tooltip="t('workspace.switchProject')"
      :aria-label="t('workspace.switchProject')"
    >
      <ToolbarIcon name="switch" />
    </summary>
    <div class="project-switcher-popover">
      <button
        v-for="project in library.projects"
        :key="project.id"
        type="button"
        :class="{ 'is-active': project.id === library.activeProjectId }"
        @click="selectProject(project.id)"
      >
        {{ project.name }}
      </button>
      <p v-if="!library.projects.length">{{ t('workspace.noProjectsFound') }}</p>
    </div>
  </details>
</template>
