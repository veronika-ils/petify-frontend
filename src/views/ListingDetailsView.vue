<template>
  <main class="container py-4">
    <div class="mb-3">
      <RouterLink class="text-decoration-none" to="/">← Back to listings</RouterLink>
    </div>

    <div class="card">
      <div class="card-body">
        <h1 class="h4 mb-2">Listing {{ id }}</h1>
        <p class="text-muted mb-0">
          Detail page placeholder. Next step is to fetch this listing by id and render full info.
        </p>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = computed(() => String(route.params.id || ''))
</script>
