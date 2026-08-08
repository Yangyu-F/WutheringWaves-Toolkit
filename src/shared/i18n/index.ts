import { createI18n } from 'vue-i18n'
import en from './locales/en'
import zhCN from './locales/zh-CN'

const saved = localStorage.getItem('wwt-locale')
export const i18n = createI18n({
  legacy: false,
  locale: saved === 'en' ? 'en' : 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: { 'zh-CN': zhCN, en },
})
