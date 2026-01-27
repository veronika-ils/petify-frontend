<template>
  <main class="container py-4">
    <div class="hero card border-0 mb-4">
      <div class="card-body py-4">
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <h1 class="h3 mb-1">Petify listings</h1>
            <p class="text-muted mb-0">Browse active listings from the community.</p>
          </div>

          <div class="d-flex gap-2 align-items-center">
            <select v-model="petType" class="form-select" aria-label="Filter by pet type">
              <option value="">All pets</option>
              <option value="Dog">Dogs</option>
              <option value="Cat">Cats</option>
              <option value="Other">Other</option>
            </select>
            <button class="btn btn-outline-secondary" type="button" @click="reload" :disabled="loading">
              {{ loading ? 'Loading…' : 'Reload' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="alert alert-warning d-flex align-items-center justify-content-between" role="alert">
      <div>
        <div class="fw-semibold">Couldn’t load from API.</div>
        <div class="small">Showing sample listings instead. {{ error }}</div>
      </div>
      <button class="btn btn-sm btn-outline-dark" type="button" @click="reload">Try again</button>
    </div>

    <div v-if="loading" class="text-muted">Loading listings…</div>

    <div v-else-if="filteredListings.length === 0" class="text-muted">
      No listings match your filters.
    </div>

    <section v-else class="grid" aria-label="Pet listings">
      <ListingCard
        v-for="listing in filteredListings"
        :key="listing.id"
        :listing="listing"
        @click="goToDetails(listing.id)"
        @view="goToDetails(listing.id)"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ListingCard from '../components/ListingCard.vue'
import type { Listing } from '../types/listing'
import { fetchListings } from '../api/listings'
import { mockListings } from '../data/mockListings'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref<string | null>(null)
const listings = ref<Listing[]>([])

const petType = ref('')

const queryText = computed(() => (route.query.q ? String(route.query.q).trim().toLowerCase() : ''))

const filteredListings = computed(() => {
  const q = queryText.value
  return listings.value
    .filter((l) => {
      if (!petType.value) return true
      if (petType.value === 'Other') return l.petType && !['Dog', 'Cat'].includes(l.petType)
      return (l.petType || '') === petType.value
    })
    .filter((l) => {
      if (!q) return true
      const haystack = [l.title, l.petType, l.breed, l.city, l.state, l.country]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
})

let abort: AbortController | null = null

async function load() {
  loading.value = true
  error.value = null

  abort?.abort()
  abort = new AbortController()

  try {
    const data = await fetchListings({ signal: abort.signal })
    listings.value = data
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    error.value = message
    listings.value = mockListings
  } finally {
    loading.value = false
  }
}

function reload() {
  load()
}

function goToDetails(id: string) {
  router.push({ name: 'listing-details', params: { id } })
}

onMounted(load)
onBeforeUnmount(() => abort?.abort())
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.16), rgba(249, 115, 22, 0.05));
  border-radius: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 18px;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1200px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
