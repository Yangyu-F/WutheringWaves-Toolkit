<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ToolkitIcon from '../../shared/components/ToolkitIcon.vue'
import { usePreferencesStore } from '../../features/settings/stores/preferences'

const preferences = usePreferencesStore()
const { sidebarCollapsed } = storeToRefs(preferences)
</script>

<template>
  <aside class="sidebar" :class="{ 'is-collapsed': sidebarCollapsed }">
    <div class="brand">
      <span class="brand-mark"><span>W</span></span>
      <div class="brand-copy">
        <strong>{{ $t('brand.name') }}</strong
        ><small>{{ $t('brand.tagline') }}</small>
      </div>
    </div>
    <nav class="sidebar-nav" :aria-label="$t('nav.primary')">
      <RouterLink to="/" class="nav-item"
        ><ToolkitIcon name="home" /><span>{{ $t('nav.home') }}</span></RouterLink
      >
      <p class="nav-label">{{ $t('nav.tools') }}</p>
      <span class="nav-item is-muted"
        ><ToolkitIcon name="calculator" /><span>{{ $t('tools.damage.name') }}</span></span
      >
      <span class="nav-item is-muted"
        ><ToolkitIcon name="box" /><span>{{ $t('tools.material.name') }}</span></span
      >
      <span class="nav-item is-muted"
        ><ToolkitIcon name="wave" /><span>{{ $t('tools.echo.name') }}</span></span
      >
      <RouterLink to="/data-status" class="nav-item"
        ><ToolkitIcon name="database" /><span>{{ $t('nav.data') }}</span></RouterLink
      >
    </nav>
    <button
      class="collapse-button"
      type="button"
      :aria-label="$t('nav.collapse')"
      @click="preferences.toggleSidebar"
    >
      <ToolkitIcon name="chevron" /> <span>{{ $t('nav.collapse') }}</span>
    </button>
  </aside>
</template>
