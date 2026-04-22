import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 預設首頁
      path: '/',
      redirect: '/map2d',
    },
    {
      path: '/map2d',
      name: 'Map2D',
      component: () => import('@/views/Map2DView.vue'),
    },
    {
      path: '/map3d',
      name: 'Map3D',
      component: () => import('@/views/Map3DView.vue'),
    },
  ],
})

export default router
