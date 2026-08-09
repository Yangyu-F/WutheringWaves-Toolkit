<script setup lang="ts">
import AppFooter from './layouts/AppFooter.vue'
import AppHeader from './layouts/AppHeader.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <div class="app-frame">
      <main class="app-main"><RouterView /></main>
    </div>
    <AppFooter />
  </div>
</template>
