<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ToolkitIcon from '../../shared/components/ToolkitIcon.vue'
import { usePreferencesStore } from '../../features/settings/stores/preferences'

const preferences = usePreferencesStore()
const { sidebarCollapsed } = storeToRefs(preferences)
</script>

<template>
  <aside id="app-sidebar" class="sidebar" :class="{ 'is-collapsed': sidebarCollapsed }">
    <div class="brand">
      <svg class="brand-mark" viewBox="0 0 52 52" aria-hidden="true">
        <path d="M26 2c2 12 12 22 24 24-12 2-22 12-24 24C24 38 14 28 2 26 14 24 24 14 26 2Z" />
        <path d="M15 26h5l2.5-7 4 14 3.5-11 2.5 7H37" />
        <circle cx="26" cy="26" r="17" />
      </svg>
      <div class="brand-copy"><strong>鸣潮工具箱</strong><small>WuWa Toolkit</small></div>
    </div>
    <nav class="sidebar-nav" :aria-label="$t('nav.primary')">
      <RouterLink to="/" class="nav-item"
        ><ToolkitIcon name="home" /><span>{{ $t('nav.home') }}</span></RouterLink
      >
      <p class="nav-label">{{ $t('nav.tools') }}</p>
      <span class="nav-item"
        ><ToolkitIcon name="calculator" /><span>{{ $t('tools.damage.name') }}</span></span
      >
      <p class="nav-label">{{ $t('nav.data') }}</p>
      <RouterLink
        v-for="entry in ['resonators', 'weapons', 'echoes', 'sonata']"
        :key="entry"
        :to="`/data-status#${entry}`"
        class="nav-item"
      >
        <ToolkitIcon :name="entry" /><span>{{ $t(`dataEntries.${entry}`) }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>
