<script setup lang="ts">
defineProps<{
  label: string
  modelValue?: number
  min?: number
  max?: number
  step?: number
  unit?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
</script>
<template>
  <label class="numeric-field"
    ><span>{{ label }}</span
    ><span class="numeric-field-control"
      ><input
        :value="modelValue"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        @change="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
      /><i v-if="unit">{{ unit }}</i></span
    ></label
  >
</template>
