<script setup lang="ts">
import ToolkitIcon from '../../shared/components/ToolkitIcon.vue'
import { i18n } from '../../shared/i18n'

const setLocale = (event: Event) => {
  i18n.global.locale.value = (event.target as HTMLSelectElement).value as 'zh-CN' | 'en'
  localStorage.setItem('wwt-locale', i18n.global.locale.value)
}
</script>

<template>
  <header class="topbar">
    <p>{{ $t('header.context') }}</p>
    <div class="global-controls">
      <label class="language-control"
        ><ToolkitIcon name="globe" :size="18" /><span class="sr-only">{{
          $t('header.language')
        }}</span>
        <select :value="$i18n.locale" @change="setLocale">
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
        </select>
      </label>
      <RouterLink to="/data-status" class="data-pill"
        ><span class="status-dot" />{{ $t('header.dataStatus') }}</RouterLink
      >
    </div>
  </header>
</template>
