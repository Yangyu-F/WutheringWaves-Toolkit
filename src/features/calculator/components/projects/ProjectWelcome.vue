<script setup lang="ts">
import { ref } from 'vue'
import { importProject } from '../../persistence/projectTransfer'
import { useProjectLibraryStore } from '../../stores/projectLibrary'
import { useI18n } from 'vue-i18n'

const library = useProjectLibraryStore()
const input = ref<HTMLInputElement>()
const error = ref('')
const { t } = useI18n()
async function createProject() {
  error.value = ''
  try {
    await library.createProject('新伤害计算')
  } catch {
    error.value = '无法创建项目，请检查浏览器存储权限。'
  }
}
async function handleImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    await library.addImportedProject(importProject(await file.text()))
  } catch {
    error.value = '无法导入：请选择有效的计算项目文件。'
  }
}
</script>

<template>
  <main class="project-welcome">
    <div class="welcome-mark"><i /><i /><i /></div>
    <p>{{ t('workspace.productName') }}</p>
    <h1>{{ t('workspace.welcomeTitle') }}</h1>
    <span>{{ t('workspace.welcomeText') }}</span>
    <div>
      <button type="button" @click="createProject">{{ t('workspace.createProject') }}</button
      ><button type="button" @click="input?.click()">{{ t('workspace.importProject') }}</button>
    </div>
    <small v-if="error" class="welcome-error">{{ error }}</small>
    <input
      ref="input"
      class="visually-hidden"
      type="file"
      accept="application/json,.json"
      @change="handleImport"
    />
  </main>
</template>
