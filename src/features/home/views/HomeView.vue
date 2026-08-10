<script setup lang="ts">
import { ref } from 'vue'
import ToolkitIcon from '../../../shared/components/ToolkitIcon.vue'

const dataEntries = ['resonators', 'weapons', 'echoes', 'sonata'] as const
const activeTab = ref<'tools' | 'catalogue'>('tools')
</script>

<template>
  <div class="home-page">
    <header class="home-hero">
      <span class="home-eyebrow">{{ $t('home.eyebrow') }}</span>
      <h1>{{ $t('home.title') }}</h1>
      <p>{{ $t('home.intro') }}</p>
    </header>

    <div class="home-tabs" role="tablist" :aria-label="$t('home.tabsLabel')">
      <button
        id="tools-tab"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'tools'"
        aria-controls="tools-panel"
        :class="{ 'is-active': activeTab === 'tools' }"
        @click="activeTab = 'tools'"
      >
        {{ $t('nav.tools') }}
      </button>
      <button
        id="catalogue-tab"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'catalogue'"
        aria-controls="catalogue-panel"
        :class="{ 'is-active': activeTab === 'catalogue' }"
        @click="activeTab = 'catalogue'"
      >
        {{ $t('home.atlasTitle') }}
      </button>
    </div>

    <section
      v-show="activeTab === 'tools'"
      id="tools-panel"
      class="damage-section"
      role="tabpanel"
      aria-labelledby="tools-tab"
    >
      <div class="home-card-grid">
        <RouterLink
          to="/tools/calculator"
          class="home-entry-card"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="home-entry-icon"><ToolkitIcon name="wave" :size="64" /></span>
          <span class="home-entry-copy">
            <strong id="damage-title">{{ $t('tools.damage.name') }}</strong>
            <small>{{ $t('tools.damage.description') }}</small>
          </span>
          <ToolkitIcon class="home-entry-arrow" name="chevron" :size="17" />
        </RouterLink>
      </div>
    </section>

    <section
      v-show="activeTab === 'catalogue'"
      id="catalogue-panel"
      class="atlas-section"
      role="tabpanel"
      aria-labelledby="catalogue-tab"
    >
      <div class="home-card-grid">
        <RouterLink
          v-for="entry in dataEntries"
          :key="entry"
          :to="`/catalogue/${entry}`"
          class="home-entry-card"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="home-entry-icon"><ToolkitIcon :name="entry" :size="64" /></span>
          <span class="home-entry-copy">
            <strong>{{ $t(`dataEntries.${entry}`) }}</strong>
            <small>{{ $t(`template.${entry}Description`) }}</small>
          </span>
          <ToolkitIcon class="home-entry-arrow" name="chevron" :size="17" />
        </RouterLink>
      </div>
    </section>
  </div>
</template>
