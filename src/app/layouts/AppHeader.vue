<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ToolkitIcon from '../../shared/components/ToolkitIcon.vue'
import { usePreferencesStore } from '../../features/settings/stores/preferences'
import { i18n } from '../../shared/i18n'

const preferences = usePreferencesStore()
const { sidebarCollapsed } = storeToRefs(preferences)

const setLocale = (event: Event) => {
  i18n.global.locale.value = (event.target as HTMLSelectElement).value as 'zh-CN' | 'en'
  localStorage.setItem('wwt-locale', i18n.global.locale.value)
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-leading">
      <button
        class="sidebar-toggle"
        type="button"
        :aria-expanded="!sidebarCollapsed"
        aria-controls="app-sidebar"
        :aria-label="$t('nav.toggle')"
        @click="preferences.toggleSidebar"
      >
        <ToolkitIcon name="menu" :size="22" />
      </button>
      <p>{{ $t('header.context') }}</p>
    </div>
    <div class="global-controls">
      <label class="topbar-select"
        ><span class="sr-only">{{ $t('header.language') }}</span>
        <select :value="$i18n.locale" @change="setLocale">
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
        </select>
      </label>
      <span class="topbar-divider" />
      <label class="topbar-select version-select"
        ><span>{{ $t('header.dataVersion') }}：</span
        ><select aria-label="数据版本">
          <option>2.8</option>
        </select></label
      >
    </div>
  </header>
</template>
