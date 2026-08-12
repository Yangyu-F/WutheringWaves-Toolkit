<script setup lang="ts">
import ToolbarIcon from '../shell/ToolbarIcon.vue'
defineProps<{
  text: string
  action?: string
  icon?: InstanceType<typeof ToolbarIcon>['$props']['name']
}>()
defineEmits<{ action: [] }>()
</script>
<template>
  <div class="empty-state">
    <ToolbarIcon :name="icon ?? 'info'" />
    <p>{{ text }}</p>
    <button v-if="action" type="button" @click="$emit('action')">{{ action }}</button>
  </div>
</template>
