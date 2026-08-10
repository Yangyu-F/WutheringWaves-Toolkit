<script setup lang="ts">
import logoHeaderUrl from '../../assets/logo-header.svg'
import ToolkitIcon from '../../shared/components/ToolkitIcon.vue'
import { i18n } from '../../shared/i18n'

const setLocale = (event: Event) => {
  i18n.global.locale.value = (event.target as HTMLSelectElement).value as 'zh-CN' | 'en'
  localStorage.setItem('wwt-locale', i18n.global.locale.value)
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-leading">
      <RouterLink to="/" class="topbar-brand" :aria-label="$t('nav.home')">
        <img class="topbar-brand-mark" :src="logoHeaderUrl" alt="" />
        <strong class="topbar-brand-name">鸣潮工具箱</strong>
      </RouterLink>
    </div>
    <div class="global-controls">
      <label class="topbar-select"
        ><span class="sr-only">{{ $t('header.language') }}</span>
        <select :value="$i18n.locale" @change="setLocale">
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
        </select>
        <ToolkitIcon class="select-chevron" name="chevron" :size="13" />
      </label>
      <span class="topbar-divider" />
      <span class="version-display"
        ><span>{{ $t('header.dataVersion') }}：</span><strong>3.5</strong></span
      >
    </div>
  </header>
</template>
