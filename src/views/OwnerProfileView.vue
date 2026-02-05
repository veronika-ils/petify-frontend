<template>
  <div class="owner-profile-main">
    <!-- Header with back button -->
    <header class="header-section">
      <div class="container">
        <RouterLink to="/" class="back-link">← Back to listings</RouterLink>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="container py-5 text-center text-muted">
      <p>Loading owner profile…</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container py-5">
      <div class="alert alert-danger" role="alert">
        <div class="fw-semibold">Failed to load owner profile</div>
        <div class="small">{{ error }}</div>
        <button class="btn btn-sm btn-outline-danger mt-2" type="button" @click="reload">
          Try again
        </button>
      </div>
    </div>

    <!-- Owner Profile Content -->
    <div v-else-if="ownerInfo" class="profile-container">
      <!-- Owner Info Card -->
      <section class="owner-info-section">
        <div class="container">
          <div class="owner-card">
            <div class="owner-header">
              <div class="owner-details">
                <h1 class="owner-name">{{ ownerInfo.firstName }} {{ ownerInfo.lastName }}</h1>
                <p class="owner-username">@{{ ownerInfo.username }}</p>
                <p class="owner-email">
                  <a :href="`mailto:${ownerInfo.email}`">{{ ownerInfo.email }}</a>
                </p>
              </div>
              <div class="contact-actions">
                <button class="btn-contact" type="button" @click="contactOwner">
                  📧 Contact Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tabs for listings and pets -->
      <section class="content-section">
        <div class="container">
          <div class="tabs-wrapper">
            <div class="tabs-header">
              <button
                :class="['tab-button', { active: activeTab === 'listings' }]"
                @click="activeTab = 'listings'"
              >
                📋 Listings ({{ ownerListings.length }})
              </button>
              <button
                :class="['tab-button', { active: activeTab === 'pets' }]"
                @click="activeTab = 'pets'"
              >
                🐾 Pets ({{ ownerPets.length }})
              </button>
              <button
                :class="['tab-button', { active: activeTab === 'reviews' }]"
                @click="activeTab = 'reviews'"
              >
                ⭐ Reviews ({{ ownerReviews.length }})
              </button>
            </div>

            <!-- Listings Tab -->
            <div v-if="activeTab === 'listings'" class="tab-content">
              <h2 class="section-title">Owner's Listings</h2>

              <div v-if="ownerListings.length === 0" class="empty-state">
                <p>This owner hasn't created any listings yet.</p>
              </div>

              <div v-else class="listings-grid">
                <div v-for="listing in ownerListings" :key="listing.listingId" class="listing-item">
                  <RouterLink :to="`/listing/${listing.listingId}`" class="listing-link">
                    <div class="listing-card">
                      <div class="listing-status" :class="statusClass(listing.status)">
                        {{ listing.status || 'Active' }}
                      </div>

                      <h3 class="listing-title">Animal #{{ listing.animalId }}</h3>
                      <p class="listing-description">{{ listing.description }}</p>

                      <div class="listing-footer">
                        <span class="listing-price" v-if="hasPrice(listing.price)">
                          ${{ formatPrice(listing.price) }}
                        </span>
                        <span class="listing-date">
                          {{ formatDate(listing.createdAt) }}
                        </span>
                      </div>
                    </div>
                  </RouterLink>
                </div>
              </div>
            </div>

            <!-- Pets Tab -->
            <div v-if="activeTab === 'pets'" class="tab-content">
              <h2 class="section-title">Owner's Pets</h2>

              <div v-if="ownerPets.length === 0" class="empty-state">
                <p>This owner hasn't added any pets yet.</p>
              </div>

              <div v-else class="pets-grid">
                <div v-for="pet in ownerPets" :key="pet.animalId" class="pet-card">
                  <div v-if="pet.photoUrl" class="pet-image">
                    <img :src="pet.photoUrl" :alt="pet.name" @error="onPetImageError" />
                  </div>
                  <div v-else class="pet-image placeholder">
                    🐾
                  </div>
                  <div class="pet-info">
                    <h3 class="pet-name">{{ pet.name }}</h3>
                    <ul class="pet-details">
                      <li v-if="pet.species">
                        <span class="label">Species:</span>
                        <span class="value">{{ pet.species }}</span>
                      </li>
                      <li v-if="pet.breed">
                        <span class="label">Breed:</span>
                        <span class="value">{{ pet.breed }}</span>
                      </li>
                      <li v-if="pet.sex">
                        <span class="label">Sex:</span>
                        <span class="value">{{ pet.sex }}</span>
                      </li>
                      <li v-if="pet.dateOfBirth">
                        <span class="label">DOB:</span>
                        <span class="value">{{ formatDate(pet.dateOfBirth) }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reviews Tab -->
            <div v-if="activeTab === 'reviews'" class="tab-content">
              <h2 class="section-title">Reviews ({{ ownerReviews.length }})</h2>

              <!-- Add Review Form (only if logged in and not own profile) -->
              <div
                v-if="auth.isAuthenticated && ownerInfo && auth.user?.userId !== ownerInfo.userId"
                class="add-review-card"
              >
                <h3 class="add-review-title">Leave a Review</h3>
                <form @submit.prevent="submitReview">
                  <div class="form-group">
                    <label class="label">Rating</label>
                    <div class="rating-input">
                      <button
                        v-for="i in 5"
                        :key="i"
                        type="button"
                        :class="['star-btn', { active: newReview.rating === i }]"
                        @click="newReview.rating = i"
                      >
                        {{ i <= newReview.rating ? '⭐' : '☆' }}
                      </button>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="label" for="comment">Comment</label>
                    <textarea
                      id="comment"
                      v-model="newReview.comment"
                      class="form-control"
                      placeholder="Share your experience with this owner..."
                      rows="4"
                    ></textarea>
                  </div>

                  <div v-if="reviewError" class="alert alert-danger" role="alert">
                    {{ reviewError }}
                  </div>

                  <div class="form-actions">
                    <button
                      type="submit"
                      class="btn btn-primary"
                      :disabled="isSubmittingReview || newReview.rating === 0"
                    >
                      <span v-if="isSubmittingReview">Submitting...</span>
                      <span v-else>Submit Review</span>
                    </button>
                  </div>
                </form>
              </div>

              <!-- Reviews List -->
              <div v-if="ownerReviews.length === 0" class="empty-state">
                <p>No reviews yet. Be the first to leave a review!</p>
              </div>

              <div v-else class="reviews-list">
                <div v-for="review in ownerReviews" :key="review.reviewId" class="review-card">
                  <div class="review-header">
                    <div class="reviewer-info">
                      <h4 class="reviewer-name">{{ review.reviewerName }}</h4>
                      <p class="reviewer-username">@{{ review.reviewerUsername }}</p>
                    </div>
                    <div class="review-actions">
                      <span class="rating">{{ '⭐'.repeat(Number(review.rating || 0)) }}</span>
                      <button
                        v-if="
                          auth.isAuthenticated &&
                          (auth.user?.userId === review.reviewerId || auth.user?.userId === ownerInfo?.userId)
                        "
                        type="button"
                        class="delete-btn"
                        @click="deleteReview(review.reviewId)"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p class="review-comment">{{ review.comment }}</p>
                  <p class="review-date">{{ formatDate(review.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getUserProfile, getUserListings, getUserPets } from '../api/profile'
import { createOrUpdateReview, getReviewsByOwner, deleteReview as deleteReviewAPI } from '../api/reviews'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()

const isLoading = ref(false)
const error = ref<string | null>(null)

const activeTab = ref<'listings' | 'pets' | 'reviews'>('listings')

const ownerInfo = ref<any>(null)
const ownerListings = ref<any[]>([])
const ownerPets = ref<any[]>([])
const ownerReviews = ref<any[]>([])

const isSubmittingReview = ref(false)
const reviewError = ref<string | null>(null)
const newReview = ref({
  rating: 0,
  comment: '',
})

let abort: AbortController | null = null

function extractArray(res: any): any[] {
  if (Array.isArray(res)) return res
  if (res?.content && Array.isArray(res.content)) return res.content
  if (res?.data && Array.isArray(res.data)) return res.data
  return []
}

async function load() {
  isLoading.value = true
  error.value = null

  ownerInfo.value = null
  ownerListings.value = []
  ownerPets.value = []
  ownerReviews.value = []

  abort?.abort()
  abort = new AbortController()

  try {
    const id = Number(route.params.ownerId)
    if (Number.isNaN(id)) throw new Error('Invalid owner ID')

    // NOTE: AbortController is kept to cancel UI state updates on route change;
    // if your API layer supports fetch signals, pass abort.signal inside those functions.
    const [userInfo, listingsRes, petsRes, reviewsRes] = await Promise.all([
      getUserProfile(id),
      getUserListings(id),
      getUserPets(id),
      getReviewsByOwner(id),
    ])

    ownerInfo.value = userInfo
    ownerListings.value = extractArray(listingsRes)
    ownerPets.value = extractArray(petsRes)
    ownerReviews.value = extractArray(reviewsRes)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    error.value = message
    console.error('Failed to load owner profile:', message)
  } finally {
    isLoading.value = false
  }
}

function reload() {
  load()
}

watch(
  () => route.params.ownerId,
  () => {
    // if user opens a different owner profile without leaving the page
    load()
  }
)

function onPetImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return ''
  }
}

function hasPrice(price: unknown): boolean {
  const n = typeof price === 'number' ? price : Number(price)
  return Number.isFinite(n) && n > 0
}

function formatPrice(price: unknown): string {
  const n = typeof price === 'number' ? price : Number(price)
  if (!Number.isFinite(n)) return ''
  return n.toFixed(2)
}

function statusClass(status: unknown): string {
  const s = String(status ?? 'active').toLowerCase()
  return `status-${s}`
}

function contactOwner() {
  if (!ownerInfo.value?.email) {
    alert('Owner email not available')
    return
  }
  window.location.href = `mailto:${ownerInfo.value.email}`
}

async function submitReview() {
  if (!auth.isAuthenticated || !auth.user?.userId) {
    alert('Please log in to submit a review')
    return
  }

  if (newReview.value.rating === 0) {
    reviewError.value = 'Please select a rating'
    return
  }

  isSubmittingReview.value = true
  reviewError.value = null

  try {
    await createOrUpdateReview(
      ownerInfo.value.userId,
      auth.user.userId,
      newReview.value.rating,
      newReview.value.comment
    )

    newReview.value.rating = 0
    newReview.value.comment = ''
    await loadReviews()
  } catch (err) {
    reviewError.value = err instanceof Error ? err.message : 'Failed to submit review'
  } finally {
    isSubmittingReview.value = false
  }
}

async function loadReviews() {
  if (!ownerInfo.value?.userId) return
  try {
    const res = await getReviewsByOwner(ownerInfo.value.userId)
    ownerReviews.value = extractArray(res)
  } catch (err) {
    console.error('Failed to load reviews:', err)
  }
}

async function deleteReview(reviewId: number) {
  if (!auth.isAuthenticated || !auth.user?.userId) {
    alert('Please log in to delete a review')
    return
  }

  if (confirm('Are you sure you want to delete this review?')) {
    try {
      await deleteReviewAPI(reviewId, auth.user.userId)
      await loadReviews()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete review')
    }
  }
}

onMounted(load)
onBeforeUnmount(() => abort?.abort())
</script>

<style scoped>
.owner-profile-main {
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

/* Owner Info Section */
.owner-info-section {
  background: white;
  padding: 40px 0;
  border-bottom: 1px solid #e5e7eb;
}

.owner-card {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.1);
}

.owner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
  flex-wrap: wrap;
}

.owner-details {
  flex: 1;
  min-width: 300px;
}

.owner-name {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #111827;
}

.owner-username {
  color: #6b7280;
  font-size: 1rem;
  margin: 0 0 8px 0;
}

.owner-email {
  color: #374151;
  font-size: 1rem;
  margin: 0;
}

.owner-email a {
  color: #d97706;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.owner-email a:hover {
  color: #b45309;
}

.contact-actions {
  display: flex;
  gap: 12px;
}

.btn-contact {
  padding: 14px 24px;
  border-radius: 8px;
  border: none;
  background: #d97706;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-contact:hover {
  background: #b45309;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
}

/* Content Section */
.content-section {
  padding: 40px 0;
}

.tabs-wrapper {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tab-button {
  flex: 1;
  padding: 20px;
  border: none;
  background: transparent;
  font-size: 1rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
}

.tab-button:hover {
  color: #111827;
  background: #f3f4f6;
}

.tab-button.active {
  color: #d97706;
  border-bottom-color: #d97706;
  background: white;
}

.tab-content {
  padding: 40px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 30px 0;
  color: #111827;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-state p {
  font-size: 1.1rem;
  margin: 0;
}

/* Listings Grid */
.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.listing-item {
  height: 100%;
}

.listing-link {
  text-decoration: none;
  display: block;
  height: 100%;
}

.listing-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
  position: relative;
}

.listing-card:hover {
  border-color: #d97706;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.15);
  transform: translateY(-4px);
}

.listing-status {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-adopted {
  background: #dbeafe;
  color: #0c2d6b;
}

.listing-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #111827;
  margin-top: 8px;
}

.listing-description {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.listing-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  font-size: 0.875rem;
}

.listing-price {
  font-weight: 700;
  color: #d97706;
  font-size: 1.1rem;
}

.listing-date {
  color: #9ca3af;
}

/* Pets Grid */
.pets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.pet-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.pet-card:hover {
  border-color: #d97706;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.15);
  transform: translateY(-4px);
}

.pet-image {
  width: 100%;
  height: 200px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  overflow: hidden;
}

.pet-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pet-image.placeholder {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.pet-info {
  padding: 20px;
}

.pet-name {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #111827;
}

.pet-details {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pet-details li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.pet-details .label {
  color: #6b7280;
  font-weight: 600;
}

.pet-details .value {
  color: #111827;
}

/* Reviews Section */
.add-review-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
}

.add-review-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: #111827;
}

.form-group {
  margin-bottom: 20px;
}

.label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.rating-input {
  display: flex;
  gap: 8px;
}

.star-btn {
  background: none;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.star-btn:hover {
  border-color: #d97706;
  background: #fef3c7;
}

.star-btn.active {
  border-color: #d97706;
  background: #fef3c7;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
  color: #111827;
  resize: vertical;
}

.form-control:focus {
  outline: none;
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.btn-primary {
  background: #d97706;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #b45309;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.alert-danger {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.review-card:hover {
  border-color: #d97706;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.1);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.reviewer-info {
  flex: 1;
}

.reviewer-name {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #111827;
}

.reviewer-username {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.review-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating {
  font-size: 1rem;
  color: #f59e0b;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  padding: 4px 8px;
}

.delete-btn:hover {
  opacity: 1;
}

.review-comment {
  color: #374151;
  line-height: 1.6;
  margin: 0 0 12px 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.review-date {
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .owner-card {
    padding: 24px;
  }

  .owner-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .owner-name {
    font-size: 1.75rem;
  }

  .contact-actions {
    width: 100%;
  }

  .btn-contact {
    flex: 1;
  }

  .tab-content {
    padding: 24px;
  }

  .listings-grid,
  .pets-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .header-section {
    padding: 12px 0;
  }

  .back-link {
    font-size: 0.875rem;
  }

  .owner-card {
    padding: 16px;
  }

  .owner-name {
    font-size: 1.5rem;
  }

  .owner-username,
  .owner-email {
    font-size: 0.875rem;
  }

  .tabs-header {
    flex-direction: column;
  }

  .tab-button {
    padding: 16px;
    border-right: 3px solid transparent;
    border-bottom: none;
  }

  .tab-button.active {
    border-right-color: #d97706;
    border-bottom-color: transparent;
  }

  .tab-content {
    padding: 16px;
  }

  .section-title {
    font-size: 1.25rem;
  }
}
</style>
