<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top nav-shadow">
    <div class="container py-2">
      <RouterLink class="navbar-brand fw-bold brand" to="/">Petify</RouterLink>

      <button
        class="navbar-toggler"
        type="button"
        aria-controls="petifyNavbar"
        :aria-expanded="isOpen ? 'true' : 'false'"
        aria-label="Toggle navigation"
        @click="isOpen = !isOpen"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="petifyNavbar" class="navbar-collapse" :class="isOpen ? 'collapse show' : 'collapse'">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/">Listings</RouterLink>
          </li>
        </ul>

        <form class="d-flex" role="search" @submit.prevent>
          <input
            v-model="query"
            class="form-control search"
            type="search"
            placeholder="Search pets"
            aria-label="Search"
          />
        </form>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    isOpen.value = false
  },
)

const query = computed({
  get: () => (route.query.q ? String(route.query.q) : ''),
  set: (value: string) => {
    router.replace({ query: { ...route.query, q: value || undefined } })
  },
})
</script>

<style scoped>
.nav-shadow {
  box-shadow: 0 6px 20px rgba(17, 24, 39, 0.06);
}

.brand {
  letter-spacing: 0.2px;
}

.search {
  min-width: 240px;
  border-radius: 12px;
}

@media (max-width: 991.98px) {
  .search {
    min-width: 0;
    width: 100%;
  }
}
</style>
