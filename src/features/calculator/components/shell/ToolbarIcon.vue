<script setup lang="ts">
defineProps<{
  name:
    | 'inspector'
    | 'results'
    | 'undo'
    | 'redo'
    | 'chevron'
    | 'close'
    | 'restore'
    | 'trash'
    | 'team'
    | 'skills'
    | 'info'
    | 'edit'
    | 'switch'
    | 'add'
}>()
</script>

<template>
  <svg v-if="name === 'inspector'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 6h7M15 6h5M4 12h3M11 12h9M4 18h9M17 18h3" />
    <circle cx="13" cy="6" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="15" cy="18" r="2" />
  </svg>
  <svg v-else-if="name === 'results'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 19V5M4 19h16M7 15l4-4 3 2 5-6" />
    <path d="M16 7h3v3" />
  </svg>
  <svg v-else-if="name === 'undo'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 7 4.5 11 9 15M5 11h8.5a5 5 0 0 1 5 5v1" />
  </svg>
  <svg v-else-if="name === 'redo'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m15 7 4.5 4-4.5 4m4-4h-8.5a5 5 0 0 0-5 5v1" />
  </svg>
  <svg v-else-if="name === 'chevron'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m8 10 4 4 4-4" />
  </svg>
  <svg v-else-if="name === 'edit'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m5 19 3.5-.7L18 8.8 15.2 6 5.7 15.5 5 19Z" />
    <path d="m13.8 7.4 2.8 2.8" />
  </svg>
  <svg v-else-if="name === 'switch'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 7h12M14 4l3 3-3 3M19 17H7M10 14l-3 3 3 3" />
  </svg>
  <svg v-else-if="name === 'add'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
  <svg v-else-if="name === 'close'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m7 7 10 10M17 7 7 17" />
  </svg>
  <svg v-else-if="name === 'restore'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 9V5h4M5.5 5.5A8 8 0 1 1 4 14M12 8v4l3 2" />
  </svg>
  <svg v-else-if="name === 'trash'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 7h14M9 7V4h6v3M8 10v8M12 10v8M16 10v8M7 7l1 13h8l1-13" />
  </svg>
  <svg v-else-if="name === 'team'" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="9" cy="8" r="3" />
    <circle cx="16.5" cy="9" r="2" />
    <path d="M3.5 19c.5-3.5 2.4-5.5 5.5-5.5s5 2 5.5 5.5M14 14.5c3.5-.5 5.5 1 6 4.5" />
  </svg>
  <svg v-else-if="name === 'skills'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
    <path d="m18.5 15 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" />
  </svg>
  <svg v-else viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 10.5V17M12 7.2v.3" />
  </svg>
</template>
