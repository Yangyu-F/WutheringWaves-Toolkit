<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type SelectValue = string | number
defineProps<{
  modelValue: SelectValue
  options: { label: string; value: SelectValue }[]
  label: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: SelectValue] }>()
const root = ref<HTMLDetailsElement>()

function close() {
  if (root.value) root.value.open = false
}
function choose(value: SelectValue) {
  emit('update:modelValue', value)
  close()
}
function navigate(event: KeyboardEvent) {
  if (!root.value?.open || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  const items = [...root.value.querySelectorAll<HTMLButtonElement>('[role="option"]')]
  if (!items.length) return
  event.preventDefault()
  const current = items.indexOf(document.activeElement as HTMLButtonElement)
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
  items[next]?.focus()
}
function closeFromOutside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) close()
}
onMounted(() => document.addEventListener('pointerdown', closeFromOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeFromOutside))
</script>

<template>
  <details ref="root" class="select-menu" @keydown.esc="close" @keydown="navigate">
    <summary :aria-label="label">
      <span>{{ options.find((option) => option.value === modelValue)?.label }}</span>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
    </summary>
    <div class="select-menu-popover" role="listbox" :aria-label="label">
      <button
        v-for="option in options"
        :key="String(option.value)"
        type="button"
        role="option"
        :aria-selected="option.value === modelValue"
        :class="{ 'is-selected': option.value === modelValue }"
        @click="choose(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </details>
</template>
