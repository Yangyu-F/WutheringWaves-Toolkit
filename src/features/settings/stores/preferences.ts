import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

export const usePreferencesStore = defineStore('preferences', () => {
  const sidebarCollapsed = useStorage('wwt-sidebar-collapsed', false)
  const toggleSidebar = () => (sidebarCollapsed.value = !sidebarCollapsed.value)
  return { sidebarCollapsed, toggleSidebar }
})
