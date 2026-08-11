<script setup lang="ts">
import ToolbarIcon from '../shell/ToolbarIcon.vue'
defineProps<{ label: string; collapsed: boolean }>()
defineEmits<{ toggle: [] }>()
</script>
<template>
  <button class="effects-summary-label" type="button" @click="$emit('toggle')">
    {{ label }}<ToolbarIcon name="chevron" :class="{ 'is-collapsed': collapsed }" /></button
  ><button
    class="effects-summary-track"
    type="button"
    :aria-label="label"
    @click="$emit('toggle')"
  />
</template>
