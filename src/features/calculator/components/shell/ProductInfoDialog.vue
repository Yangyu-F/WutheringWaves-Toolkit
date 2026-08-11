<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import brandLogo from '../../../../assets/logo-header.svg'
import ToolbarIcon from './ToolbarIcon.vue'

defineEmits<{ close: [] }>()
const { locale, t } = useI18n()
function changeLocale(value: string) {
  locale.value = value
  localStorage.setItem('wwt-locale', value)
}
</script>

<template>
  <div class="product-dialog-backdrop" @click.self="$emit('close')">
    <section
      class="product-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="t('workspace.productInfo')"
    >
      <button
        class="dialog-close"
        type="button"
        :aria-label="t('workspace.close')"
        @click="$emit('close')"
      >
        <ToolbarIcon name="close" />
      </button>
      <img :src="brandLogo" alt="" />
      <h2>{{ t('workspace.productName') }}</h2>
      <p>{{ t('workspace.dataVersion') }}</p>
      <select
        :value="locale"
        aria-label="语言"
        @change="changeLocale(($event.target as HTMLSelectElement).value)"
      >
        <option value="zh-CN">简体中文</option>
        <option value="en">English</option>
      </select>
    </section>
  </div>
</template>
