<template>
  <main class="listings-main">
    <!-- Hero Section with Filters -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-left">
          <h1 class="hero-title">Find your perfect pet</h1>
          <p class="hero-subtitle">Browse trusted listings from our community</p>

          <!-- Filters Box -->
          <div class="search-box mt-5">
            <div class="pet-type-selector mb-3">
              <button
                v-for="pet in petTypes"
                :key="pet.value"
                :class="['pet-btn', { active: petType === pet.value }]"
                @click="petType = pet.value"
              >
                <span class="pet-icon">
                  <img v-if="pet.type === 'image'" :src="pet.icon" :alt="pet.label" class="pet-icon-img" />
                  <span v-else>{{ pet.icon }}</span>
                </span>
                <span>{{ pet.label }}</span>
              </button>
            </div>

            <div class="search-inputs">
              <div class="filters">
                <!-- Breed dropdown (from listings) -->
                <select v-model="selectedBreed" class="form-select" aria-label="Filter by breed">
                  <option value="">All breeds</option>
                  <option v-for="b in breedOptions" :key="b" :value="b">{{ b }}</option>
                </select>

                <!-- City dropdown (from listings) -->
                <select
                  v-model="selectedCity"
                  class="form-select"
                  aria-label="Filter by location"
                  :disabled="useNearMe"
                >
                  <option value="">All locations</option>
                  <option v-for="c in cityOptions" :key="c" :value="c">{{ c }}</option>
                </select>

                <!-- Near me -->
                <button
                  class="btn btn-outline-near"
                  type="button"
                  @click="toggleNearMe"
                  :disabled="geoLoading"
                >
                  <span v-if="!useNearMe && !geoLoading">Use my location</span>
                  <span v-else-if="geoLoading">Locating…</span>
                  <span v-else>Using my location</span>
                </button>
              </div>

              <!-- Radius when Near me is on -->
              <div v-if="useNearMe" class="near-me-row">
                <label class="small text-muted">Radius (km)</label>
                <input
                  v-model.number="radiusKm"
                  type="range"
                  min="1"
                  max="200"
                  step="1"
                  class="form-range"
                  aria-label="Distance radius"
                />
                <div class="small fw-semibold">{{ radiusKm }} km</div>
              </div>

              <!-- Geo status -->
              <div v-if="geoError" class="small text-danger mt-2">{{ geoError }}</div>
              <div v-else-if="useNearMe && !geoCoords" class="small text-muted mt-2">
                We’ll show nearby listings when location is available.
              </div>
              <div v-else-if="useNearMe && geoCoords && !hasGeoListings" class="small text-muted mt-2">
                Your browser location is available, but listings don’t include coordinates yet, so we can’t filter by
                distance.
              </div>
            </div>
          </div>
        </div>

        <div class="hero-right">
          <div class="benefits-card">
            <h3 class="benefits-title">Why Petify?</h3>
            <ul class="benefits-list">
              <li><span class="benefit-icon">✓</span>Verified pet owners</li>
              <li><span class="benefit-icon">✓</span>Safe listings</li>
              <li><span class="benefit-icon">✓</span>Community verified</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Listings Section -->
    <section class="listings-section">
      <div class="container">
        <div class="listings-header">
          <div>
            <h2 class="listings-title">Browse all listings</h2>
            <p class="listings-subtitle">Scroll to see available pets</p>
          </div>
          <button class="btn btn-outline-secondary" type="button" @click="reload" :disabled="loading">
            {{ loading ? 'Loading…' : 'Reload' }}
          </button>
        </div>

        <div v-if="error" class="alert alert-warning d-flex align-items-center justify-content-between" role="alert">
          <div>
            <div class="fw-semibold">Couldn't load from API.</div>
            <div class="small">Showing sample listings instead. {{ error }}</div>
          </div>
          <button class="btn btn-sm btn-outline-dark" type="button" @click="reload">Try again</button>
        </div>

        <div v-if="loading" class="text-center py-5 text-muted">
          <p>Loading listings…</p>
        </div>

        <div v-else-if="filteredListings.length === 0" class="text-center py-5 text-muted">
          <p>No listings match your filters.</p>
        </div>

        <section v-else class="grid" aria-label="Pet listings">
          <ListingCard
            v-for="listing in filteredListings"
            :key="listing.id"
            :listing="listing"
            :favorited="listing.favorited"
            @click="goToDetails(listing.id)"
            @view="goToDetails(listing.id)"
            @favorite="handleFavorite"
          />
        </section>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ListingCard from '../components/ListingCard.vue'
import type { Listing } from '../types/listing'
import { fetchListings } from '../api/listings'
import { mockListings } from '../data/mockListings'
import { useAuthStore } from '../stores/auth'
import { addFavorite, removeFavorite, getFavoritedListings } from '../api/favorites'
import { getPet } from '../api/profile'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(false)
const error = ref<string | null>(null)
const listings = ref<Listing[]>([])
const favoritedListingIds = ref<Set<number>>(new Set())

const petType = ref('')

// Filters
const selectedBreed = ref('')
const selectedCity = ref('')

// Geolocation ("Near me")
const useNearMe = ref(false)
const radiusKm = ref(25)
const geoLoading = ref(false)
const geoError = ref<string | null>(null)
const geoCoords = ref<{ lat: number; lng: number } | null>(null)

const petTypes = [
  { value: '', label: 'All pets', icon: new URL('../img/all_outline.png', import.meta.url).href, type: 'image' },
  { value: 'Dog', label: 'Dogs', icon: new URL('../img/dog_outline.png', import.meta.url).href, type: 'image' },
  { value: 'Cat', label: 'Cats', icon: new URL('../img/cat_outline.png', import.meta.url).href, type: 'image' },
  { value: 'Other', label: 'Other', icon: new URL('../img/bird_outline.png', import.meta.url).href, type: 'image' },
]

const breedOptions = computed(() => {
  const set = new Set<string>()
  for (const l of listings.value) {
    // Keep breed dropdown relevant to selected pet type
    if (petType.value) {
      if (petType.value === 'Other') {
        if (l.petType && ['Dog', 'Cat'].includes(l.petType)) continue
      } else if ((l.petType || '') !== petType.value) {
        continue
      }
    }
    const b = (l.breed || '').trim()
    if (b) set.add(b)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const cityOptions = computed(() => {
  const set = new Set<string>()
  for (const l of listings.value) {
    const c = (l.city || '').trim()
    if (c) set.add(c)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const hasGeoListings = computed(() => listings.value.some((l) => !!getListingCoords(l)))

const filteredListings = computed(() => {
  return listings.value
    .filter((l) => {
      if (!petType.value) return true
      if (petType.value === 'Other') return l.petType && !['Dog', 'Cat'].includes(l.petType)
      return (l.petType || '') === petType.value
    })
    .filter((l) => {
      if (!selectedBreed.value) return true
      return (l.breed || '').trim() === selectedBreed.value
    })
    .filter((l) => {
      if (useNearMe.value) return true
      if (!selectedCity.value) return true
      return (l.city || '').trim() === selectedCity.value
    })
    .filter((l) => {
      if (!useNearMe.value) return true
      if (!geoCoords.value) return true // waiting for permission
      const coords = getListingCoords(l)
      if (!coords) return true // listing has no coords -> can't filter it out safely
      return haversineKm(geoCoords.value.lat, geoCoords.value.lng, coords.lat, coords.lng) <= radiusKm.value
    })
    .map((l) => {
      const id = Number((l as any).id || (l as any).listingId)
      return {
        ...l,
        favorited: Number.isFinite(id) && favoritedListingIds.value.has(id),
      }
    })
})

function getListingCoords(listing: any): { lat: number; lng: number } | null {
  const lat =
    typeof listing.latitude === 'number'
      ? listing.latitude
      : typeof listing.lat === 'number'
        ? listing.lat
        : typeof listing.locationLat === 'number'
          ? listing.locationLat
          : null

  const lng =
    typeof listing.longitude === 'number'
      ? listing.longitude
      : typeof listing.lng === 'number'
        ? listing.lng
        : typeof listing.locationLng === 'number'
          ? listing.locationLng
          : null

  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (v: number) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

let abort: AbortController | null = null

async function load() {
  loading.value = true
  error.value = null

  abort?.abort()
  abort = new AbortController()

  try {
    const data = await fetchListings({ signal: abort.signal })

    // Fetch pet images for each listing
    const listingsWithImages = await Promise.all(
      data.map(async (listing) => {
        try {
          if (listing.animalId) {
            const pet = await getPet(listing.animalId)
            return {
              ...listing,
              imageUrl: pet.photoUrl || new URL('../img/all_outline.png', import.meta.url).href,
            }
          }
        } catch (err) {
          // If pet fetch fails, just continue without image
          console.error(`Failed to fetch pet ${listing.animalId}:`, err)
        }
        return {
          ...listing,
          imageUrl: new URL('../img/all_outline.png', import.meta.url).href,
        }
      })
    )

    listings.value = listingsWithImages
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    error.value = message
    listings.value = mockListings
  }

  if (auth.isAuthenticated && auth.user?.userId) {
    await loadUserFavorites()
  } else {
    favoritedListingIds.value.clear()
  }

  loading.value = false
}

async function loadUserFavorites() {
  try {
    if (!auth.isAuthenticated || !auth.user?.userId) {
      favoritedListingIds.value.clear()
      return
    }
    const favorites = await getFavoritedListings(auth.user.userId)
    favoritedListingIds.value = new Set(
      favorites.map((f) => Number(f.listingId)).filter((id) => Number.isFinite(id) && id > 0),
    )
  } catch (error) {
    console.error('Failed to load favorites:', error)
    favoritedListingIds.value.clear()
  }
}

function reload() {
  load()
}

function toggleNearMe() {
  if (useNearMe.value) {
    useNearMe.value = false
    geoError.value = null
    return
  }

  geoError.value = null
  useNearMe.value = true
  selectedCity.value = ''

  if (!('geolocation' in navigator)) {
    geoError.value = 'Geolocation is not supported in this browser.'
    return
  }

  geoLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      geoCoords.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      geoLoading.value = false
    },
    (err) => {
      geoLoading.value = false
      geoCoords.value = null
      useNearMe.value = false
      if (err.code === err.PERMISSION_DENIED) geoError.value = 'Location permission was denied.'
      else if (err.code === err.POSITION_UNAVAILABLE) geoError.value = 'Location is unavailable right now.'
      else if (err.code === err.TIMEOUT) geoError.value = 'Location request timed out.'
      else geoError.value = 'Could not access your location.'
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
  )
}

function goToDetails(id: string) {
  router.push({ name: 'listing-details', params: { id } })
}

async function handleFavorite(event: { listing: Listing; favorited: boolean }) {
  if (!auth.isAuthenticated || !auth.user?.userId) {
    alert('Please log in to save favorites')
    return
  }

  try {
    const listingId = Number((event.listing as any).id || (event.listing as any).listingId)

    if (event.favorited) {
      await addFavorite(auth.user.userId, listingId)
      favoritedListingIds.value.add(listingId)
    } else {
      await removeFavorite(auth.user.userId, listingId)
      favoritedListingIds.value.delete(listingId)
    }
  } catch (error) {
    console.error('Failed to update favorite:', error)
    alert('Failed to update favorite. Please try again.')
  }
}

onMounted(load)
onBeforeUnmount(() => abort?.abort())
</script>

<style scoped>
.listings-main {
  margin: 0;
  padding: 0;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #d97706 0%, #f97316 100%);
  color: white;
  padding: 60px 40px;
  min-height: 500px;
  display: flex;
  align-items: center;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  align-items: center;
}

.hero-left {
  padding-right: 20px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 1.25rem;
  opacity: 0.95;
  margin: 0;
}

.search-box {
  background: white;
  padding: 32px;
  border-radius: 12px;
  color: #333;
}

.pet-type-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.pet-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  font-weight: 500;
}

.pet-btn:hover {
  border-color: #d97706;
  background: #fef3c7;
}

.pet-btn.active {
  border-color: #d97706;
  background: #d97706;
  color: white;
}

.pet-icon {
  font-size: 1.5rem;
}

.pet-icon-img {
  width: 5rem;
  height: 4rem;
  object-fit: contain;
}

.search-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filters {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: center;
}

.form-select {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-select:focus {
  border-color: #d97706;
  outline: none;
  box-shadow: none;
}

.btn-outline-near {
  border: 2px solid #d97706;
  color: #b45309;
  background: transparent;
  border-radius: 8px;
  padding: 12px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-outline-near:hover:not(:disabled) {
  background: #fef3c7;
}

.btn-outline-near:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.near-me-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
}

/* Benefits Card */
.hero-right {
  display: flex;
  justify-content: center;
  align-items: center;
}

.benefits-card {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 32px;
  backdrop-filter: blur(10px);
  max-width: 320px;
  width: 100%;
}

.benefits-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  margin-top: 0;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefits-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  font-size: 1rem;
  line-height: 1.5;
}

.benefit-icon {
  font-size: 1.25rem;
  font-weight: 700;
  color: #4ade80;
  flex-shrink: 0;
}

/* Listings Section */
.listings-section {
  padding: 60px 40px;
  background: #f9fafb;
}

.listings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.listings-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.listings-subtitle {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 1rem;
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

/* Responsive */
@media (max-width: 991.98px) {
  .hero-section {
    padding: 40px 20px;
    min-height: auto;
  }

  .hero-content {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .hero-left {
    padding-right: 0;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .search-box {
    padding: 20px;
  }

  .pet-type-selector {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .pet-btn {
    padding: 12px 8px;
    font-size: 0.75rem;
  }

  .pet-icon {
    font-size: 1.25rem;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .btn-outline-near {
    width: 100%;
  }

  .near-me-row {
    grid-template-columns: 1fr;
  }

  .listings-section {
    padding: 40px 20px;
  }

  .listings-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .listings-title {
    font-size: 1.5rem;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
