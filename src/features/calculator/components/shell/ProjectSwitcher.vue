<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjectLibraryStore } from '../../stores/projectLibrary'
import ToolbarIcon from './ToolbarIcon.vue'

const library = useProjectLibraryStore()
const { t } = useI18n()
const root = ref<HTMLDetailsElement>()
const searchInput = ref<HTMLInputElement>()
const query = ref('')
const projects = computed(() => {
  const normalized = query.value.trim().toLocaleLowerCase()
  return normalized
    ? library.projects.filter((project) => project.name.toLocaleLowerCase().includes(normalized))
    : library.projects
})

async function handleToggle() {
  if (!root.value?.open) return
  query.value = ''
  await nextTick()
  searchInput.value?.focus()
}
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
  <details ref="root" class="project-switcher" @toggle="handleToggle" @keydown.esc="close">
    <summary :title="t('workspace.switchProject')" :aria-label="t('workspace.switchProject')">
      <ToolbarIcon name="switch" />
    </summary>
    <div class="project-switcher-popover">
      <input
        ref="searchInput"
        v-model="query"
        type="search"
        :placeholder="t('workspace.searchProjects')"
      />
      <button
        v-for="project in projects"
        :key="project.id"
        type="button"
        :class="{ 'is-active': project.id === library.activeProjectId }"
        @click="selectProject(project.id)"
      >
        {{ project.name }}
      </button>
      <p v-if="!projects.length">{{ t('workspace.noProjectsFound') }}</p>
    </div>
  </details>
</template>
