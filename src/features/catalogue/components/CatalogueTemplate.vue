<script setup lang="ts">
import ToolkitIcon from '../../../shared/components/ToolkitIcon.vue'

defineProps<{ titleKey: string; descriptionKey: string; icon: string }>()
</script>

<template>
  <div class="template-page catalogue-template">
    <header class="template-hero">
      <span class="template-icon"><ToolkitIcon :name="icon" :size="40" /></span>
      <div>
        <p class="template-kicker">{{ $t('template.catalogue') }}</p>
        <h1>{{ $t(titleKey) }}</h1>
        <p>{{ $t(descriptionKey) }}</p>
      </div>
    </header>
    <div class="catalogue-toolbar" aria-hidden="true">
      <span>{{ $t('template.filter') }}</span
      ><span>{{ $t('template.dataVersion') }} 2.8</span>
    </div>
    <section class="template-empty">
      <ToolkitIcon :name="icon" :size="56" />
      <h2>{{ $t('template.ready') }}</h2>
      <p>{{ $t('template.catalogueEmpty') }}</p>
    </section>
    <RouterLink to="/" class="template-back">← {{ $t('template.back') }}</RouterLink>
  </div>
</template>
