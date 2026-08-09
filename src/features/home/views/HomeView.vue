<script setup lang="ts">
import ToolkitIcon from '../../../shared/components/ToolkitIcon.vue'

const dataEntries = ['resonators', 'weapons', 'echoes', 'sonata'] as const
</script>

<template>
  <div class="home-page">
    <div class="content-rail" aria-hidden="true"><span /><span /></div>

    <header class="home-hero">
      <h1>{{ $t('home.title') }}</h1>
      <p>{{ $t('home.intro') }}</p>
      <span class="glyph-line">⌁ ᨈ ᨊ ᨅ · ⌁ ᨆ ᨉ ᨇ</span>
    </header>

    <section class="damage-section" aria-labelledby="damage-title">
      <div class="section-title-row">
        <ToolkitIcon name="wave" :size="28" />
        <div>
          <h2 id="damage-title">{{ $t('tools.damage.name') }}</h2>
          <p>{{ $t('tools.damage.description') }}</p>
        </div>
      </div>

      <svg
        class="resonance-diagram"
        viewBox="0 0 920 250"
        role="img"
        :aria-label="$t('home.diagramLabel')"
      >
        <g class="diagram-faint">
          <circle cx="205" cy="126" r="78" />
          <circle cx="205" cy="126" r="48" />
          <circle cx="675" cy="126" r="88" />
          <circle cx="675" cy="126" r="62" />
          <circle cx="675" cy="126" r="36" />
          <circle cx="85" cy="126" r="24" />
          <circle cx="520" cy="54" r="18" />
          <circle cx="520" cy="204" r="18" />
          <path
            d="M205 32v188M675 20v212M85 90v72M520 24v210M760 52v144M825 74v104"
            stroke-dasharray="3 7"
          />
        </g>
        <path
          class="diagram-line"
          d="M15 126h75c14 0 14-12 22 0 8 12 10-23 17 0 8 27 13-43 21 0 8 47 13-80 23 0 9 78 15-49 25 0 8 43 13-29 22 0 8 22 13-13 21 0h72c10 0 11-18 18 0 8 20 11-38 20 0 8 35 12-64 21 0 9 60 16-91 27 0 10 83 18-59 28 0 9 51 15-30 25 0 9 25 13-16 22 0h435"
        />
        <g class="diagram-nodes">
          <circle cx="85" cy="126" r="5" />
          <circle cx="205" cy="126" r="5" />
          <circle cx="520" cy="126" r="5" />
          <circle cx="675" cy="126" r="8" />
          <circle cx="760" cy="126" r="4" />
          <path d="m205 42 6 6-6 6-6-6 6-6Zm470-10 7 7-7 7-7-7 7-7Zm0 170 7 7-7 7-7-7 7-7Z" />
        </g>
      </svg>

      <span class="text-action"
        >{{ $t('home.explore') }}<ToolkitIcon name="chevron" :size="16"
      /></span>
    </section>

    <section class="atlas-section" aria-labelledby="atlas-title">
      <div class="section-title-row atlas-heading">
        <ToolkitIcon name="database" :size="28" />
        <div>
          <h2 id="atlas-title">{{ $t('home.atlasTitle') }}</h2>
          <p>{{ $t('home.atlasDescription') }}</p>
        </div>
      </div>
      <div class="atlas-grid">
        <RouterLink
          v-for="entry in dataEntries"
          :key="entry"
          :to="`/data-status#${entry}`"
          class="atlas-entry"
        >
          <span class="atlas-icon"><ToolkitIcon :name="entry" :size="72" /></span>
          <strong>{{ $t(`dataEntries.${entry}`) }}</strong>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
