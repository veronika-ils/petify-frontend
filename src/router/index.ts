import { createRouter, createWebHistory } from 'vue-router'
import ListingsView from '../views/ListingsView.vue'
import ListingDetailsView from '../views/ListingDetailsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'listings',
      component: ListingsView,
    },
    {
      path: '/listing/:id',
      name: 'listing-details',
      component: ListingDetailsView,
    },
  ],
})

export default router
