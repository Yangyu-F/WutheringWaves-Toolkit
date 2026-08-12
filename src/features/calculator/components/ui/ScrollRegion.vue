<script setup lang="ts">
import CustomScrollArea from './CustomScrollArea.vue'
</script>

<template>
  <CustomScrollArea root-class="scroll-region" :show-vertical="false" :show-horizontal="false">
    <slot />
  </CustomScrollArea>
</template>
