<script setup lang="ts">
defineProps<{ name: string; size?: number }>()
</script>

<template>
  <svg
    class="toolkit-icon"
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      v-if="name === 'home'"
      d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-9Z"
    />
    <path v-else-if="name === 'chevron'" d="m9 5 7 7-7 7" />
    <path
      v-else-if="name === 'globe'"
      d="M3 12h18M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z"
    />
    <path
      v-else-if="name === 'database'"
      d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"
    />
    <path
      v-else-if="name === 'calculator'"
      d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 4h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"
    />
    <path v-else-if="name === 'box'" d="m4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10" />
    <path v-else-if="name === 'wave'" d="M3 12h3l2-6 4 12 3-9 2 6h4" />
    <path v-else-if="name === 'menu'" d="M4 6h16M4 12h16M4 18h16" />
    <path
      v-else-if="name === 'resonators'"
      d="M12 3c1 4.5 4.5 8 9 9-4.5 1-8 4.5-9 9-1-4.5-4.5-8-9-9 4.5-1 8-4.5 9-9Zm0 5v8M8 12h8"
    />
    <path
      v-else-if="name === 'weapons'"
      d="m5 19 4-4m6-6 4-4-1-2-2 1-4 4m-7-3 14 14M4 20l3-1-2-2-1 3Z"
    />
    <path
      v-else-if="name === 'echoes'"
      d="M12 3a9 9 0 1 0 9 9M12 6a6 6 0 1 0 6 6M12 9a3 3 0 1 0 3 3"
    />
    <path
      v-else-if="name === 'sonata'"
      d="M12 2c.8 4.8 4.2 8.2 9 10-4.8 1.8-8.2 5.2-9 10-.8-4.8-4.2-8.2-9-10 4.8-1.8 8.2-5.2 9-10Zm0 6v8M8 12h8"
    />
    <path v-else d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />
  </svg>
</template>

<style scoped>
.toolkit-icon {
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: none;
}
</style>
