<template>
  <main class="container py-5" style="max-width: 520px">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4 p-md-5">
        <h1 class="h4 mb-1">Welcome back</h1>
        <p class="text-muted mb-4">Log in to manage your Petify account.</p>

        <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

        <form @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label" for="username">Username</label>
            <input
              id="username"
              v-model.trim="username"
              class="form-control"
              type="text"
              autocomplete="username"
              required
            />
          </div>

          <div class="mb-3">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              v-model="password"
              class="form-control"
              type="password"
              autocomplete="current-password"
              required
              minlength="6"
            />
          </div>

          <button class="btn btn-primary w-100" type="submit" :disabled="loading">
            {{ loading ? 'Logging in…' : 'Log in' }}
          </button>
        </form>

        <div class="d-flex justify-content-between mt-3">
          <RouterLink class="link" to="/">Back to listings</RouterLink>
          <RouterLink class="link" to="/signup">Create account</RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function submit() {
  error.value = null
  loading.value = true
  try {
    await auth.login({ username: username.value, password: password.value })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.link {
  text-decoration: none;
}
</style>
