<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import brandLogo from '../../../../assets/logo-header.svg'
import ModalDialog from '../ui/ModalDialog.vue'
import SelectMenu from '../ui/SelectMenu.vue'

defineEmits<{ close: [] }>()
const { locale, t } = useI18n()
function changeLocale(value: string) {
  locale.value = value
  localStorage.setItem('wwt-locale', value)
}
const localeOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en' },
]
</script>

<template>
  <ModalDialog
    :title="t('workspace.productInfo')"
    :close-label="t('workspace.close')"
    size="small"
    @close="$emit('close')"
  >
    <div class="product-info-content">
      <img :src="brandLogo" alt="" />
      <h2>{{ t('workspace.productName') }}</h2>
      <p>{{ t('workspace.dataVersion') }}</p>
      <SelectMenu
        :model-value="locale"
        :options="localeOptions"
        label="语言"
        @update:model-value="changeLocale(String($event))"
      />
    </div>
  </ModalDialog>
</template>
