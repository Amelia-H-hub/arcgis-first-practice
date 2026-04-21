import { createRouter, createWebHistory } from 'vue-router'
import CoordinateConverter from '@/views/coordinateConverter.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/coordinateConverter',
      name: 'coordinateConverter',
      component: CoordinateConverter,
    },
  ],
})

export default router
