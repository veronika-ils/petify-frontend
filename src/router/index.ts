import { createRouter, createWebHistory } from 'vue-router'
import ListingsView from '../views/ListingsView.vue'
import ListingDetailsView from '../views/ListingDetailsView.vue'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import ProfileView from '../views/ProfileView.vue'
import OwnerProfileView from '../views/OwnerProfileView.vue'
import AdminReviewsView from '@/views/AdminReviewsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'listings',
      component: ListingsView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },
    {
      path: '/profile/:userId',
      name: 'user-profile',
      component: ProfileView,
    },
    {
      path: '/owner/:ownerId',
      name: 'owner-profile',
      component: OwnerProfileView,
    },
    {
      path: '/listing/:id',
      name: 'listing-details',
      component: ListingDetailsView,
    },
    {
      path: '/admin/reviews',
      name: 'admin-reviews',
      component: AdminReviewsView,
    },
  ],
})

export default router
