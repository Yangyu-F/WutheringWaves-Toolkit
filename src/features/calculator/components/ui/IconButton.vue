<script setup lang="ts">
import ToolbarIcon from '../shell/ToolbarIcon.vue'
defineProps<{
  icon: InstanceType<typeof ToolbarIcon>['$props']['name']
  label: string
  disabled?: boolean
  active?: boolean
}>()
defineEmits<{ click: [event: MouseEvent] }>()
</script>
<template>
  <button
    class="icon-button"
    :class="{ 'is-active': active }"
    type="button"
    :title="label"
    :aria-label="label"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <ToolbarIcon :name="icon" />
  </button>
</template>
