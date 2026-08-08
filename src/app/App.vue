<script setup lang="ts">
import AppHeader from './layouts/AppHeader.vue'
import AppSidebar from './layouts/AppSidebar.vue'
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
    <div class="app-frame">
      <AppHeader />
      <main class="app-main"><RouterView /></main>
    </div>
  </div>
</template>
