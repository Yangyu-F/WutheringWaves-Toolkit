import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../../features/home/views/HomeView.vue') },
    {
      path: '/data-status',
      name: 'data-status',
      component: () => import('../../features/data-status/views/DataStatusView.vue'),
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
