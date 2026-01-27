<template>
  <main class="container py-5" style="max-width: 520px">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4 p-md-5">
        <h1 class="h4 mb-1">Create your account</h1>
        <p class="text-muted mb-4">Create an account to start using Petify.</p>

        <div v-if="success" class="alert alert-success" role="alert">{{ success }}</div>
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
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              v-model.trim="email"
              class="form-control"
              type="email"
              autocomplete="email"
              required
            />
          </div>

          <div class="row g-2">
            <div class="col-12 col-md-6">
              <div class="mb-3">
                <label class="form-label" for="firstName">First name</label>
                <input
                  id="firstName"
                  v-model.trim="firstName"
                  class="form-control"
                  type="text"
                  autocomplete="given-name"
                  required
                />
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="mb-3">
                <label class="form-label" for="lastName">Last name</label>
                <input
                  id="lastName"
                  v-model.trim="lastName"
                  class="form-control"
                  type="text"
                  autocomplete="family-name"
                  required
                />
              </div>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              v-model="password"
              class="form-control"
              type="password"
              autocomplete="new-password"
              required
              minlength="6"
            />
            <div class="form-text">At least 6 characters.</div>
          </div>

          <div class="mb-3">
            <label class="form-label" for="confirm">Confirm password</label>
            <input
              id="confirm"
              v-model="confirm"
              class="form-control"
              type="password"
              autocomplete="new-password"
              required
              minlength="6"
            />
          </div>

          <button class="btn btn-primary w-100" type="submit" :disabled="loading">
            {{ loading ? 'Creating…' : 'Create account' }}
          </button>
        </form>

        <div class="d-flex justify-content-between mt-3">
          <RouterLink class="link" to="/">Back to listings</RouterLink>
          <RouterLink class="link" to="/login">Already have an account?</RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const email = ref('')
const firstName = ref('')
const lastName = ref('')
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

async function submit() {
  error.value = null
  success.value = null

  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  try {
    const result = await auth.signup({
      username: username.value,
      email: email.value,
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value,
    })
    if (result.tokenReturned) {
      await router.replace('/')
      return
    }

    success.value = 'Account created. Please log in.'
    setTimeout(() => {
      router.push('/login')
    }, 600)
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
