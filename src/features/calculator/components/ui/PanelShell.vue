<script setup lang="ts">
defineProps<{ title: string }>()
</script>
<template>
  <section class="panel-shell">
    <header class="panel-shell-title">
      <strong>{{ title }}</strong>
    </header>
    <div class="panel-shell-content"><slot /></div>
  </section>
</template>
