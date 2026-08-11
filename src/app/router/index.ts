import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'workspace',
      component: () => import('../../features/calculator/views/ProjectWorkspaceView.vue'),
    },
    {
      path: '/tools/calculator',
      name: 'calculator',
      redirect: '/',
    },
    {
      path: '/tools/calculator/timeline',
      name: 'calculator-timeline',
      redirect: '/',
    },
    {
      path: '/catalogue/resonators',
      name: 'resonators',
      redirect: '/',
    },
    {
      path: '/catalogue/weapons',
      name: 'weapons',
      redirect: '/',
    },
    {
      path: '/catalogue/echoes',
      name: 'echoes',
      redirect: '/',
    },
    {
      path: '/catalogue/sonata',
      name: 'sonata',
      redirect: '/',
    },
    {
      path: '/data-status',
      name: 'data-status',
      redirect: '/',
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
