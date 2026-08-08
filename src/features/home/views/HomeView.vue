<script setup lang="ts">
import ToolkitIcon from '../../../shared/components/ToolkitIcon.vue'

const tools = [
  { key: 'damage', icon: 'calculator', featured: true },
  { key: 'material', icon: 'box', featured: false },
  { key: 'echo', icon: 'wave', featured: false },
] as const
</script>

<template>
  <div class="home-page">
    <section class="hero-copy">
      <p class="eyebrow">{{ $t('home.eyebrow') }}</p>
      <h1>{{ $t('home.title') }}</h1>
      <p class="hero-intro">{{ $t('home.intro') }}</p>
    </section>

    <div class="section-heading">
      <h2>{{ $t('home.section') }}</h2>
      <span>{{ $t('home.phase') }}</span>
    </div>
    <section class="tool-grid" aria-labelledby="tools-heading">
      <article
        v-for="(tool, index) in tools"
        :key="tool.key"
        class="tool-card"
        :class="{ featured: tool.featured }"
        :style="{ '--order': index }"
      >
        <div class="card-copy">
          <span class="card-icon"><ToolkitIcon :name="tool.icon" :size="22" /></span>
          <p class="card-kicker">{{ tool.featured ? $t('home.featured') : $t('home.planned') }}</p>
          <h3>{{ $t(`tools.${tool.key}.name`) }}</h3>
          <p>{{ $t(`tools.${tool.key}.description`) }}</p>
          <span class="card-action"
            >{{ tool.featured ? $t('home.explore') : $t('home.planned')
            }}<ToolkitIcon name="chevron" :size="16"
          /></span>
        </div>
        <div v-if="tool.featured" class="signal-art" aria-hidden="true">
          <span class="orbit orbit-one" /><span class="orbit orbit-two" />
          <svg viewBox="0 0 480 210" preserveAspectRatio="none">
            <path
              d="M0 126h55l18-52 32 99 45-142 40 132 32-86 31 60 38-29 35 18 34-71 37 117 25-46h58"
            />
            <path class="soft" d="M0 145c70-45 105 43 172-7s104-4 145 1 78-44 163 1" />
          </svg>
        </div>
      </article>

      <article class="atlas-card" :style="{ '--order': 3 }">
        <div class="atlas-pattern" aria-hidden="true"><span /><span /><span /></div>
        <div>
          <p class="card-kicker">DATA ATLAS</p>
          <h3>{{ $t('home.atlasTitle') }}</h3>
          <p>{{ $t('home.atlasDescription') }}</p>
        </div>
        <RouterLink to="/data-status" class="primary-action"
          >{{ $t('home.atlasAction') }}<ToolkitIcon name="chevron" :size="16"
        /></RouterLink>
      </article>
    </section>

    <footer class="site-footer">
      <span>{{ $t('home.footer') }}</span
      ><span>{{ $t('home.source') }}</span>
    </footer>
  </div>
</template>
