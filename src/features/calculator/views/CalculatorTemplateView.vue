<script setup lang="ts">
import ToolkitIcon from '../../../shared/components/ToolkitIcon.vue'
</script>
<template>
  <div class="template-page calculator-template">
    <header class="template-hero">
      <span class="template-icon"><ToolkitIcon name="calculator" :size="40" /></span>
      <div>
        <p class="template-kicker">{{ $t('template.tool') }}</p>
        <h1>{{ $t('tools.damage.name') }}</h1>
        <p>{{ $t('tools.damage.description') }}</p>
      </div>
    </header>
    <nav class="workspace-tabs" :aria-label="$t('template.workspace')">
      <span class="is-active">{{ $t('template.loadout') }}</span
      ><span>{{ $t('template.timeline') }}</span
      ><span>{{ $t('template.results') }}</span>
    </nav>
    <section class="calculator-placeholder">
      <div v-for="section in ['loadout', 'timeline', 'results']" :key="section">
        <span />
        <h2>{{ $t(`template.${section}`) }}</h2>
        <p>{{ $t(`template.${section}Empty`) }}</p>
      </div>
    </section>
    <RouterLink to="/" class="template-back">← {{ $t('template.back') }}</RouterLink>
  </div>
</template>
