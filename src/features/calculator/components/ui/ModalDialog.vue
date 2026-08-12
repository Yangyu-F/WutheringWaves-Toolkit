<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import ToolbarIcon from '../shell/ToolbarIcon.vue'

defineProps<{ title: string; closeLabel: string; size?: 'small' | 'medium' }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLElement>()
const previousFocus = document.activeElement as HTMLElement | null

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
    return
  }
  if (event.key !== 'Tab' || !dialog.value) return
  const items = [
    ...dialog.value.querySelectorAll<HTMLElement>('button, input, summary, [tabindex]'),
  ].filter((item) => item.tabIndex >= 0 && !item.hasAttribute('disabled'))
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  await nextTick()
  dialog.value?.querySelector<HTMLElement>('[data-autofocus], .modal-close')?.focus()
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  previousFocus?.focus()
})
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <section
        ref="dialog"
        class="modal-dialog"
        :class="`is-${size ?? 'medium'}`"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <header class="modal-header">
          <h2>{{ title }}</h2>
          <button class="modal-close" type="button" :aria-label="closeLabel" @click="emit('close')">
            <ToolbarIcon name="close" />
          </button>
        </header>
        <div class="modal-content"><slot /></div>
        <footer v-if="$slots.footer" class="modal-footer"><slot name="footer" /></footer>
      </section>
    </div>
  </Teleport>
</template>
