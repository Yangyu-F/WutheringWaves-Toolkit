<script setup lang="ts">
import ToolbarIcon from '../shell/ToolbarIcon.vue'
defineProps<{ text: string; icon?: InstanceType<typeof ToolbarIcon>['$props']['name'] }>()
</script>
<template>
  <div class="empty-state">
    <ToolbarIcon :name="icon ?? 'info'" />
    <p>{{ text }}</p>
  </div>
</template>
