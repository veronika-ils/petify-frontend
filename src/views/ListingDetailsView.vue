<template>
  <main class="listing-details-main">
    <!-- Header with back button -->
    <header class="header-section">
      <div class="container">
        <RouterLink to="/" class="back-link">← Back to listings</RouterLink>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="container py-5 text-center text-muted">
      <p>Loading listing details…</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container py-5">
      <div class="alert alert-danger" role="alert">
        <div class="fw-semibold">Failed to load listing</div>
        <div class="small">{{ error }}</div>
        <button class="btn btn-sm btn-outline-danger mt-2" type="button" @click="reload">Try again</button>
      </div>
    </div>

    <!-- Listing Details -->
    <div v-else-if="listing" class="details-container">
      <section class="image-section">
        <div class="container">
          <div class="image-wrapper">
            <img :src="imageSrc" :alt="listing.title || 'Pet listing'" class="main-image" @error="onImageError" />
            <button
              class="favorite-btn"
              type="button"
              @click="toggleFavorite"
              :aria-pressed="isFavorited"
              :title="isFavorited ? 'Remove from favorites' : 'Add to favorites'"
            >
              {{ isFavorited ? '♥' : '♡' }}
            </button>
            <div v-if="listing.status" class="status-badge">{{ listing.status }}</div>
          </div>
        </div>
      </section>

      <section class="details-section">
        <div class="container">
          <div class="details-grid">
            <!-- Left column: Main info -->
            <div class="left-column">
              <!-- Title and price -->
              <div class="header-info">
                <div>
                  <h1 class="listing-title">{{ listing.title }}</h1>
                  <p v-if="createdText" class="posted-date">Posted {{ createdText }}</p>
                </div>
                <div v-if="priceText" class="price-display">{{ priceText }}</div>
              </div>

              <!-- Pet characteristics -->
              <div v-if="hasPetInfo" class="pet-info-card">
                <h2 class="section-title">About {{ listing.title }}</h2>
                <div class="pet-details">
                  <div v-if="listing.petType" class="detail-row">
                    <span class="label">Type:</span>
                    <span class="value">{{ listing.petType }}</span>
                  </div>
                  <div v-if="listing.breed" class="detail-row">
                    <span class="label">Breed:</span>
                    <span class="value">{{ listing.breed }}</span>
                  </div>
                  <div v-if="listing.age" class="detail-row">
                    <span class="label">Age:</span>
                    <span class="value">{{ listing.age }} {{ listing.ageUnit || 'years' }}</span>
                  </div>
                  <div v-if="listing.gender" class="detail-row">
                    <span class="label">Gender:</span>
                    <span class="value">{{ listing.gender }}</span>
                  </div>
                  <div v-if="listing.size" class="detail-row">
                    <span class="label">Size:</span>
                    <span class="value">{{ listing.size }}</span>
                  </div>
                </div>
              </div>

              <!-- Health and traits -->
              <div v-if="healthTraits.length > 0" class="health-traits-card">
                <h2 class="section-title">Health & Traits</h2>
                <ul class="traits-list">
                  <li v-for="trait in healthTraits" :key="trait" class="trait-item">{{ trait }}</li>
                </ul>
              </div>

              <!-- Description -->
              <div v-if="listing.description" class="description-card">
                <h2 class="section-title">Description</h2>
                <p class="description-text">{{ listing.description }}</p>
              </div>

              <!-- Location -->
              <div v-if="locationParts.length > 0" class="location-card">
                <h2 class="section-title">Location</h2>
                <p class="location-text">{{ locationParts.join(', ') }}</p>
              </div>
            </div>

            <!-- Right column: Contact and owner info -->
            <aside class="right-column">
              <!-- Action buttons -->
              <div class="action-buttons">
                <button class="btn-primary" type="button" @click="contactOwner">
                  <span class="btn-text">Contact Owner</span>
                </button>
                <button class="btn-secondary" type="button" @click="toggleFavorite">
                  <span class="btn-text">{{ isFavorited ? '♥ Saved' : '♡ Save' }}</span>
                </button>
              </div>

              <!-- Owner info placeholder -->
              <div class="owner-card">
                <h3 class="owner-title">Listing Details</h3>
                <div class="owner-info">
                  <div v-if="ownerName" class="info-row">
                    <span class="label">Owner:</span>
                    <span class="value">{{ ownerName }}</span>
                  </div>
                  <div v-if="animalName" class="info-row">
                    <span class="label">Pet Name:</span>
                    <span class="value">{{ animalName }}</span>
                  </div>
                </div>
              </div>

              <!-- Share -->
              <div class="share-section">
                <p class="share-title">Share this listing</p>
                <div class="share-buttons">
                  <button class="share-btn" type="button" @click="copyLink" :title="copyLinkText">
                    🔗
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import type { Listing } from '../types/listing'
import { fetchListingById, fetchUserName, fetchPetName } from '../api/listings'
import { useAuthStore } from '../stores/auth'
import { addFavorite, removeFavorite } from '../api/favorites'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const id = computed(() => String(route.params.id || ''))
const loading = ref(false)
const error = ref<string | null>(null)
const listing = ref<Listing | null>(null)
const ownerName = ref<string | null>(null)
const animalName = ref<string | null>(null)
const isFavorited = ref(false)
const imageBroken = ref(false)
const copyLinkText = ref('Copy link')

let abort: AbortController | null = null

const placeholderImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="%23f2f3f5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="%238a8f98">Petify</text></svg>'

const imageSrc = computed(() => {
  if (imageBroken.value) return placeholderImage
  return (
    listing.value?.imageUrl ||
    listing.value?.image ||
    listing.value?.photos?.[0] ||
    listing.value?.images?.[0] ||
    placeholderImage
  )
})

const priceText = computed(() => {
  const price = listing.value?.price ?? listing.value?.fee ?? listing.value?.adoptionFee
  const currency = listing.value?.currency || 'USD'
  if (price === null || price === undefined) return ''
  const num = Number(price)
  if (Number.isFinite(num)) {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(num)
    } catch {
      return `$${num}`
    }
  }
  return String(price)
})

const createdText = computed(() => {
  const raw = listing.value?.createdAt
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
  } catch {
    return ''
  }
})

const hasPetInfo = computed(() => {
  if (!listing.value) return false
  return !!(listing.value.petType || listing.value.breed || listing.value.age || listing.value.gender || listing.value.size)
})

const healthTraits = computed(() => {
  if (!listing.value) return []
  const traits: string[] = []
  if (listing.value.vaccinated) traits.push('Vaccinated')
  if (listing.value.neutered) traits.push('Neutered')
  if (listing.value.spayed) traits.push('Spayed')
  if (Array.isArray(listing.value.tags)) {
    traits.push(...listing.value.tags.slice(0, 5))
  }
  return traits
})

const locationParts = computed(() => {
  const parts: string[] = []
  if (listing.value?.city) parts.push(listing.value.city)
  if (listing.value?.state) parts.push(listing.value.state)
  if (listing.value?.country) parts.push(listing.value.country)
  return parts
})

async function load() {
  loading.value = true
  error.value = null
  listing.value = null
  ownerName.value = null
  animalName.value = null
  isFavorited.value = false

  abort?.abort()
  abort = new AbortController()

  try {
    const data = await fetchListingById(id.value, { signal: abort.signal })
    listing.value = data

    // Fetch owner and animal names in parallel
    const [ownerNameResult, animalNameResult] = await Promise.all([
      data.ownerId ? fetchUserName(data.ownerId, { signal: abort.signal }) : Promise.resolve(null),
      data.animalId ? fetchPetName(data.animalId, { signal: abort.signal }) : Promise.resolve(null),
    ])

    ownerName.value = ownerNameResult
    animalName.value = animalNameResult
    checkFavorite()
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    error.value = message
  } finally {
    loading.value = false
  }
}

function checkFavorite() {
  if (!auth.isAuthenticated || !listing.value?.listingId) {
    isFavorited.value = false
    return
  }
  isFavorited.value = false
}

function reload() {
  load()
}

function onImageError() {
  imageBroken.value = true
}

async function toggleFavorite() {
  if (!auth.isAuthenticated || !auth.user?.userId || !listing.value?.listingId) {
    alert('Please log in to save favorites')
    return
  }

  try {
    const listingId = Number(listing.value.listingId)
    if (isFavorited.value) {
      await removeFavorite(auth.user.userId, listingId)
      isFavorited.value = false
    } else {
      await addFavorite(auth.user.userId, listingId)
      isFavorited.value = true
    }
  } catch (error) {
    console.error('Failed to update favorite:', error)
    alert('Failed to update favorite. Please try again.')
  }
}

function contactOwner() {
  if (!listing.value?.ownerId) {
    alert('Owner information not available')
    return
  }
  router.push({ name: 'owner-profile', params: { ownerId: listing.value.ownerId } })
}

function copyLink() {
  const url = window.location.href
  navigator.clipboard
    .writeText(url)
    .then(() => {
      copyLinkText.value = '✓ Copied!'
      setTimeout(() => {
        copyLinkText.value = 'Copy link'
      }, 2000)
    })
    .catch(() => {
      alert('Failed to copy link')
    })
}

onMounted(load)
onBeforeUnmount(() => abort?.abort())
</script>

<style scoped>
.listing-details-main {
  background: #f9fafb;
  min-height: 100vh;
  padding-bottom: 60px;
}

/* Header Section */
.header-section {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-link {
  display: inline-flex;
  align-items: center;
  color: #d97706;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.back-link:hover {
  color: #b45309;
  gap: 4px;
}

/* Image Section */
.image-section {
  background: white;
  padding: 40px 0;
}

.image-wrapper {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  background: #f3f4f6;
  aspect-ratio: 4 / 3;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.favorite-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #e5e7eb;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.favorite-btn:hover {
  background: #fef3c7;
  border-color: #d97706;
  transform: scale(1.1);
}

.status-badge {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: #d97706;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Details Section */
.details-section {
  padding: 40px 0;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 40px;
  align-items: start;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 100px;
}

/* Header Info */
.header-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.listing-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #111827;
}

.posted-date {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.price-display {
  font-size: 2rem;
  font-weight: 700;
  color: #d97706;
  white-space: nowrap;
}

/* Cards */
.pet-info-card,
.health-traits-card,
.description-card,
.location-card,
.owner-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #111827;
}

.pet-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-row .label {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
}

.detail-row .value {
  color: #111827;
  font-weight: 500;
}

.traits-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.trait-item {
  background: #fef3c7;
  color: #b45309;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.description-text {
  color: #374151;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.location-text {
  color: #374151;
  font-size: 1.125rem;
  margin: 0;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  font-size: 1rem;
}

.btn-primary {
  background: #d97706;
  color: white;
}

.btn-primary:hover {
  background: #b45309;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
}

.btn-secondary {
  background: white;
  color: #d97706;
  border: 2px solid #d97706;
}

.btn-secondary:hover {
  background: #fef3c7;
}

.btn-text {
  display: block;
}

/* Owner Card */
.owner-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #111827;
}

.owner-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-row .label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
}

.info-row .value {
  color: #374151;
  font-weight: 500;
}

/* Share Section */
.share-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.share-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 12px 0;
}

.share-buttons {
  display: flex;
  gap: 8px;
}

.share-btn {
  flex: 1;
  padding: 10px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.share-btn:hover {
  border-color: #d97706;
  background: #fef3c7;
}

/* Responsive */
@media (max-width: 991.98px) {
  .listing-title {
    font-size: 2rem;
  }

  .header-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .price-display {
    font-size: 1.5rem;
  }

  .details-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .right-column {
    position: static;
    grid-column: 1;
  }

  .image-section {
    padding: 20px 0;
  }

  .details-section {
    padding: 20px 0;
  }
}

@media (max-width: 576px) {
  .header-section {
    padding: 16px 0;
  }

  .back-link {
    font-size: 0.875rem;
  }

  .listing-title {
    font-size: 1.5rem;
  }

  .pet-info-card,
  .health-traits-card,
  .description-card,
  .location-card,
  .owner-card,
  .share-section {
    padding: 16px;
  }

  .section-title {
    font-size: 1rem;
  }

  .action-buttons {
    grid-column: 1;
    flex-direction: row;
  }

  .btn-primary,
  .btn-secondary {
    flex: 1;
    padding: 10px 12px;
    font-size: 0.875rem;
  }
}
</style>
