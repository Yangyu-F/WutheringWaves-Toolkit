<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { downloadProject, importProject } from '../../persistence/projectTransfer'
import { useProjectLibraryStore } from '../../stores/projectLibrary'
import { useTimelineStore } from '../../stores/timeline'
import { useI18n } from 'vue-i18n'
import ProjectSwitcher from './ProjectSwitcher.vue'
import ToolbarIcon from './ToolbarIcon.vue'
import IconButton from '../ui/IconButton.vue'

const library = useProjectLibraryStore()
const timeline = useTimelineStore()
const importInput = ref<HTMLInputElement>()
const projectMenu = ref<HTMLDetailsElement>()
const firstMenuAction = ref<HTMLButtonElement>()
const editingName = ref(false)
const renameCancelled = ref(false)
const draftName = ref('')
const transferMessage = ref('')
const { t } = useI18n()

function closeProjectMenu() {
  if (projectMenu.value) projectMenu.value.open = false
}
function closeProjectMenuFromOutside(event: PointerEvent) {
  if (!projectMenu.value?.contains(event.target as Node)) closeProjectMenu()
}
onMounted(() => document.addEventListener('pointerdown', closeProjectMenuFromOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeProjectMenuFromOutside))

function beginRename() {
  renameCancelled.value = false
  draftName.value = library.activeProject?.name ?? ''
  editingName.value = true
}
async function finishRename() {
  if (renameCancelled.value) {
    editingName.value = false
    return
  }
  await library.renameActive(draftName.value)
  editingName.value = false
}
function cancelRename() {
  renameCancelled.value = true
  editingName.value = false
}
async function handleProjectMenuToggle() {
  if (!projectMenu.value?.open) return
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  firstMenuAction.value?.focus()
}
function handleProjectMenuKeydown(event: KeyboardEvent) {
  if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return
  const buttons = [
    ...(projectMenu.value?.querySelectorAll<HTMLButtonElement>('div > button') ?? []),
  ].filter((button) => !button.disabled)
  if (!buttons.length) return
  event.preventDefault()
  const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
  const direction = event.key === 'ArrowDown' ? 1 : -1
  buttons[(current + direction + buttons.length) % buttons.length]?.focus()
}
async function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    await library.addImportedProject(importProject(await file.text()))
    transferMessage.value = '导入成功'
  } catch {
    transferMessage.value = '导入失败：文件无效或过大'
  } finally {
    input.value = ''
  }
}
function exportActiveProject() {
  const project = library.snapshotActive() ?? library.activeProject
  if (project) downloadProject(project)
  closeProjectMenu()
}
</script>

<template>
  <header class="editor-toolbar">
    <div class="project-title">
      <ProjectSwitcher />
      <input
        v-if="editingName"
        v-model="draftName"
        maxlength="80"
        autofocus
        @blur="finishRename"
        @keydown.enter="finishRename"
        @keydown.esc.prevent="cancelRename"
      />
      <template v-else>
        <span class="project-name">{{ library.activeProject?.name ?? '未打开项目' }}</span>
        <button
          class="project-edit"
          type="button"
          :title="t('workspace.renameProject')"
          :aria-label="t('workspace.renameProject')"
          @click="beginRename"
        >
          <ToolbarIcon name="edit" />
        </button>
      </template>
      <button
        class="save-status"
        :class="`is-${library.saveStatus}`"
        type="button"
        :disabled="library.saveStatus !== 'error'"
        @click="library.saveActive"
      >
        {{ t(`workspace.saveStatus.${library.saveStatus}`) }}
      </button>
    </div>
    <div class="toolbar-history">
      <IconButton
        icon="undo"
        :label="t('workspace.undoTimeline')"
        :disabled="!timeline.past.length"
        @click="timeline.undo"
      />
      <IconButton
        icon="redo"
        :label="t('workspace.redoTimeline')"
        :disabled="!timeline.future.length"
        @click="timeline.redo"
      />
    </div>
    <div class="toolbar-actions">
      <details
        ref="projectMenu"
        class="project-menu"
        @toggle="handleProjectMenuToggle"
        @keydown.esc="closeProjectMenu"
        @keydown="handleProjectMenuKeydown"
      >
        <summary>
          <span>{{ t('workspace.projectMenu') }}</span
          ><ToolbarIcon name="chevron" />
        </summary>
        <div>
          <button
            ref="firstMenuAction"
            type="button"
            @click="(library.createProject(), closeProjectMenu())"
          >
            {{ t('workspace.newProject') }}
          </button>
          <button
            type="button"
            :disabled="!library.activeProject"
            @click="(library.duplicateActive(), closeProjectMenu())"
          >
            {{ t('workspace.duplicate') }}
          </button>
          <button type="button" @click="(importInput?.click(), closeProjectMenu())">
            {{ t('workspace.import') }}
          </button>
          <button type="button" :disabled="!library.activeProject" @click="exportActiveProject">
            {{ t('workspace.export') }}
          </button>
        </div>
      </details>
      <span v-if="transferMessage" class="toolbar-message">{{ transferMessage }}</span>
    </div>
    <input
      ref="importInput"
      class="visually-hidden"
      type="file"
      accept="application/json,.json"
      @change="handleImport"
    />
  </header>
</template>
