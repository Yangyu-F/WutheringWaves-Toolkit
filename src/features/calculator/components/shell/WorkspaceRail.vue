<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import IconButton from '../ui/IconButton.vue'

defineProps<{
  side: 'left' | 'right'
  active?: 'team' | 'skills' | 'inspector' | 'results'
}>()
defineEmits<{
  select: [panel: 'team' | 'skills' | 'inspector' | 'results']
  info: []
}>()
const { t } = useI18n()
</script>

<template>
  <aside class="workspace-rail" :class="`is-${side}`">
    <template v-if="side === 'left'">
      <IconButton
        icon="team"
        :label="t('workspace.teamMode')"
        :active="active === 'team'"
        @click="$emit('select', 'team')"
      />
      <IconButton
        icon="skills"
        :label="t('workspace.skillMode')"
        :active="active === 'skills'"
        @click="$emit('select', 'skills')"
      />
      <IconButton
        class="rail-bottom"
        icon="info"
        :label="t('workspace.productInfo')"
        @click="$emit('info')"
      />
    </template>
    <template v-else>
      <IconButton
        icon="inspector"
        :label="t('workspace.inspector')"
        :active="active === 'inspector'"
        @click="$emit('select', 'inspector')"
      />
      <IconButton
        icon="results"
        :label="t('workspace.results')"
        :active="active === 'results'"
        @click="$emit('select', 'results')"
      />
    </template>
  </aside>
</template>
