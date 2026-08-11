<script setup lang="ts">
defineProps<{ label: string }>()
</script>
<template>
  <label class="toolbar-field"
    ><span>{{ label }}</span
    ><slot
  /></label>
</template>
