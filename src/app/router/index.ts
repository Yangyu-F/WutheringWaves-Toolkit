import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../../features/home/views/HomeView.vue'),
      meta: { titleKey: 'header.context' },
    },
    {
      path: '/calculator',
      name: 'calculator',
      component: () => import('../../features/calculator/views/CalculatorTemplateView.vue'),
      meta: { titleKey: 'tools.damage.name' },
    },
    {
      path: '/catalogue/resonators',
      name: 'resonators',
      component: () => import('../../features/catalogue/views/ResonatorCatalogueView.vue'),
      meta: { titleKey: 'dataEntries.resonators' },
    },
    {
      path: '/catalogue/weapons',
      name: 'weapons',
      component: () => import('../../features/catalogue/views/WeaponCatalogueView.vue'),
      meta: { titleKey: 'dataEntries.weapons' },
    },
    {
      path: '/catalogue/echoes',
      name: 'echoes',
      component: () => import('../../features/catalogue/views/EchoCatalogueView.vue'),
      meta: { titleKey: 'dataEntries.echoes' },
    },
    {
      path: '/catalogue/sonata',
      name: 'sonata',
      component: () => import('../../features/catalogue/views/SonataCatalogueView.vue'),
      meta: { titleKey: 'dataEntries.sonata' },
    },
    {
      path: '/data-status',
      name: 'data-status',
      component: () => import('../../features/data-status/views/DataStatusView.vue'),
      meta: { titleKey: 'data.title' },
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
