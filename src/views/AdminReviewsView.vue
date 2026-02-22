<template>
  <div class="admin-reviews-container">
    <!-- Header -->
    <div class="header-section">
      <div class="container">
        <div class="header-content">
          <h1 class="page-title">User Reviews Management</h1>
          <p class="page-subtitle">View and manage reviews for all users</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="container">
        <!-- Users List and Reviews View -->
        <div class="reviews-layout">
          <!-- Left: Users List -->
          <div class="users-panel">
            <div class="panel-header">
              <h2 class="panel-title">Users</h2>
              <div class="search-box">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search users..."
                  class="search-input"
                />
              </div>
            </div>

            <div v-if="isLoading" class="loading-state">
              <p>Loading users...</p>
            </div>

            <div v-else-if="filteredUsers.length === 0" class="empty-state">
              <p>No users found</p>
            </div>

            <div v-else class="users-list">
              <div
                v-for="user in filteredUsers"
                :key="user.userId"
                :class="['user-item', { active: selectedUserId === user.userId }]"
                @click="selectUser(user)"
              >
                <div class="user-info">
                  <h4 class="user-name">{{ user.firstName }} {{ user.lastName }}</h4>
                  <p class="user-username">@{{ user.username }}</p>
                  <p class="user-email">{{ user.email }}</p>
                  <div class="user-stats">
                    <span class="stat-item">
                      <i class="bi bi-chat-dots"></i> {{ getUserReviewCount(user.userId) }} reviews
                    </span>
                    <span class="stat-item">
                      <img src="@/img/star.png" alt="star" class="stat-star" />
                      {{ getUserAverageRating(user.userId).toFixed(1) }}
                    </span>
                  </div>
                </div>
                <div class="user-type-badge">
                  <span class="badge" :class="getUserTypeBadgeClass(user.userType)">
                    {{ user.userType }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Reviews View -->
          <div class="reviews-panel">
            <div v-if="!selectedUser" class="empty-reviews">
              <div class="empty-icon">📋</div>
              <p>Select a user to view their reviews</p>
            </div>

            <div v-else>
              <div class="panel-header">
                <div class="header-top">
                  <h2 class="panel-title">Reviews for {{ selectedUser.firstName }} {{ selectedUser.lastName }}</h2>
                  <button
                    v-if="!selectedUser.isBlocked"
                    @click="openBlockModal(selectedUser)"
                    class="btn btn-danger-sm"
                  >
                    <i class="bi bi-ban"></i> Block User
                  </button>
                  <button
                    v-else
                    @click="unblockUser(selectedUser.userId)"
                    class="btn btn-success-sm"
                  >
                    <i class="bi bi-check-circle"></i> Unblock User
                  </button>
                </div>
                <p class="user-meta">@{{ selectedUser.username }} • {{ selectedUser.userType }}</p>
                <p v-if="selectedUser.isBlocked" class="blocked-info">
                  🔒 This user is blocked: {{ selectedUser.blockedReason }}
                </p>
              </div>

              <div v-if="isLoadingReviews" class="loading-state">
                <p>Loading reviews...</p>
              </div>

              <div v-else-if="userReviews.length === 0" class="empty-state">
                <p>No reviews for this user</p>
              </div>

              <div v-else class="reviews-list">
                <div v-for="review in userReviews" :key="review.reviewId" class="review-card">
                  <div class="review-header">
                    <div class="reviewer-info">
                      <h4 class="reviewer-name">{{ review.reviewerName }}</h4>
                      <p class="reviewer-username">@{{ review.reviewerUsername }}</p>
                    </div>
                    <div class="review-rating">
                      <img
                        v-for="i in Number(review.rating || 0)"
                        :key="i"
                        src="@/img/star.png"
                        alt="star"
                        class="star"
                      />
                    </div>
                  </div>

                  <div class="review-content">
                    <p class="review-comment">{{ review.comment }}</p>
                  </div>

                  <div class="review-footer">
                    <span class="review-date">{{ formatDate(review.createdAt) }}</span>
                    <span class="review-id">ID: {{ review.reviewId }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Block User Modal -->
    <div v-if="showBlockModal" class="modal-overlay" @click.self="closeBlockModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Block User</h3>
          <button @click="closeBlockModal" class="close-btn">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-body">
          <p class="modal-text">
            Are you sure you want to block <strong>{{ userToBlock?.firstName }} {{ userToBlock?.lastName }}</strong>?
          </p>
          <p class="modal-subtext">
            They will not be able to log in until they are unblocked.
          </p>

          <div class="form-group">
            <label class="form-label">Reason for blocking:</label>
            <textarea
              v-model="blockReason"
              placeholder="Enter the reason for blocking this user (optional)"
              class="form-control"
              rows="4"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeBlockModal" class="btn btn-outline-secondary">
            Cancel
          </button>
          <button @click="confirmBlockUser" class="btn btn-danger">
            <i class="bi bi-ban"></i> Block User
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { getAllUsers } from '../api/admin'
import { getReviewsByOwner } from '../api/reviews'

const router = useRouter()
const auth = useAuthStore()

const users = ref<any[]>([])
const userReviews = ref<any[]>([])
const userReviewStats = ref<Map<number, { count: number; avgRating: number }>>(new Map())
const selectedUserId = ref<number | null>(null)
const searchQuery = ref('')
const isLoading = ref(false)
const isLoadingReviews = ref(false)
const showBlockModal = ref(false)
const userToBlock = ref<any | null>(null)
const blockReason = ref('')

// Filter to show only non-admin users
const filteredUsers = computed(() => {
  return users.value
    .filter(user => user.userType !== 'ADMIN')
    .filter(user => {
      const query = searchQuery.value.toLowerCase()
      return (
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
    })
})

const selectedUser = computed(() => {
  return users.value.find(u => u.userId === selectedUserId.value) || null
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getUserTypeBadgeClass(userType: string): string {
  switch (userType) {
    case 'OWNER':
      return 'bg-primary'
    case 'CLIENT':
      return 'bg-info'
    default:
      return 'bg-secondary'
  }
}

function getUserReviewCount(userId: number): number {
  const stats = userReviewStats.value.get(userId)
  return stats ? stats.count : 0
}

function getUserAverageRating(userId: number): number {
  const stats = userReviewStats.value.get(userId)
  return stats ? stats.avgRating : 0
}

async function loadUsers() {
  if (!auth.user?.userId) return

  try {
    isLoading.value = true
    const allUsers = await getAllUsers(auth.user.userId)
    // Filter out admins
    users.value = allUsers.filter((user: any) => user.userType !== 'ADMIN')

    // Load reviews for all users to calculate stats
    await loadAllUserReviewStats()
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    isLoading.value = false
  }
}

async function loadAllUserReviewStats() {
  try {
    // For each user, fetch their reviews and calculate stats
    for (const user of users.value) {
      try {
        const reviews = await getReviewsByOwner(user.userId)

        if (reviews && reviews.length > 0) {
          const avgRating = reviews.reduce((sum: number, review: any) => sum + (Number(review.rating) || 0), 0) / reviews.length
          userReviewStats.value.set(user.userId, {
            count: reviews.length,
            avgRating: avgRating,
          })
        } else {
          userReviewStats.value.set(user.userId, {
            count: 0,
            avgRating: 0,
          })
        }
      } catch (error) {
        console.error(`Failed to load reviews for user ${user.userId}:`, error)
        userReviewStats.value.set(user.userId, {
          count: 0,
          avgRating: 0,
        })
      }
    }
  } catch (error) {
    console.error('Failed to load review stats:', error)
  }
}

async function selectUser(user: any) {
  selectedUserId.value = user.userId

  await loadUserReviews(user.userId)
}

async function loadUserReviews(userId: number) {
  try {
    isLoadingReviews.value = true
    const reviews = await getReviewsByOwner(userId)
    userReviews.value = reviews
  } catch (error) {
    console.error('Failed to load reviews:', error)
    userReviews.value = []
  } finally {
    isLoadingReviews.value = false
  }
}

function openBlockModal(user: any) {
  userToBlock.value = user
  blockReason.value = ''
  showBlockModal.value = true
}

function closeBlockModal() {
  showBlockModal.value = false
  userToBlock.value = null
  blockReason.value = ''
}

async function confirmBlockUser() {
  if (!userToBlock.value || !auth.user?.userId) return

  try {
    // Import the blockUser function from admin API
    const { blockUser } = await import('../api/admin')
    await blockUser(auth.user.userId, userToBlock.value.userId, true, blockReason.value)

    // Update user blocked status
    const blockedUser = users.value.find(u => u.userId === userToBlock.value.userId)
    if (blockedUser) {
      blockedUser.isBlocked = true
      blockedUser.blockedReason = blockReason.value
    }

    closeBlockModal()
  } catch (error) {
    console.error('Failed to block user:', error)
    alert('Failed to block user')
  }
}

async function unblockUser(userId: number) {
  if (!auth.user?.userId) return

  if (!confirm('Are you sure you want to unblock this user?')) return

  try {
    const { blockUser } = await import('../api/admin')
    await blockUser(auth.user.userId, userId, false, '')

    // Update user blocked status
    const unblockedUser = users.value.find(u => u.userId === userId)
    if (unblockedUser) {
      unblockedUser.isBlocked = false
      unblockedUser.blockedReason = ''
    }
  } catch (error) {
    console.error('Failed to unblock user:', error)
    alert('Failed to unblock user')
  }
}

onMounted(() => {
  // Check if user is admin
  if (!auth.isAuthenticated || auth.user?.userType !== 'ADMIN') {
    router.push('/login')
    return
  }

  loadUsers()
})
</script>

<style scoped>
.admin-reviews-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%);
  min-height: 100vh;
  padding-bottom: 60px;
}

/* Header Section */
.header-section {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  padding: 40px 0;
  margin-bottom: 40px;
  box-shadow: 0 10px 30px rgba(249, 115, 22, 0.2);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

/* Main Content */
.main-content {
  padding: 0;
}

.reviews-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

/* Users Panel */
.users-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: fit-content;
}

.panel-header {
  padding: 20px;
  border-bottom: 2px solid #e2e8f0;
  background: #f7fafc;
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 16px 0;
}

.user-meta {
  font-size: 0.9rem;
  color: #718096;
  margin: 0;
}

.search-box {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.users-list {
  display: flex;
  flex-direction: column;
  max-height: 600px;
  overflow-y: auto;
}

.user-item {
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.user-item:hover {
  background: #f7fafc;
}

.user-item.active {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%);
  border-left: 4px solid #f97316;
  padding-left: 16px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 4px 0;
}

.user-username {
  font-size: 0.85rem;
  color: #718096;
  margin: 0 0 2px 0;
}

.user-email {
  font-size: 0.8rem;
  color: #a0aec0;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-stats {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4a5568;
}

.stat-item i {
  font-size: 0.85rem;
  color: #f97316;
}

.stat-star {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.user-type-badge {
  flex-shrink: 0;
}

/* Reviews Panel */
.reviews-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-reviews {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
  color: #718096;
}

.empty-icon {
  font-size: 3rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  color: #718096;
  background: #f7fafc;
  text-align: center;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #718096;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  overflow-y: auto;
  max-height: 700px;
}

/* Review Card */
.review-card {
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.review-card:hover {
  border-color: #f97316;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.15);
  transform: translateY(-2px);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.reviewer-info {
  flex: 1;
  min-width: 0;
}

.reviewer-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 4px 0;
}

.reviewer-username {
  font-size: 0.85rem;
  color: #718096;
  margin: 0;
}

.review-rating {
  display: flex;
  gap: 4px;
}

.star {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.review-content {
  margin-bottom: 12px;
}

.review-comment {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #4a5568;
  margin: 0;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  font-size: 0.8rem;
  color: #a0aec0;
}

.review-date {
  font-weight: 500;
}

.review-id {
  color: #cbd5e0;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bg-primary {
  background: #bee3f8;
  color: #2c5282;
}

.bg-info {
  background: #b2e0d8;
  color: #234e52;
}

.bg-secondary {
  background: #cbd5e0;
  color: #2d3748;
}

/* Header Top Layout */
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Action Buttons */
.btn-danger-sm,
.btn-success-sm {
  padding: 6px 12px;
  font-size: 0.85rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-danger-sm {
  background: #dc2626;
  color: white;
}

.btn-danger-sm:hover {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.btn-success-sm {
  background: #16a34a;
  color: white;
}

.btn-success-sm:hover {
  background: #15803d;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.blocked-info {
  color: #dc2626;
  background: #fee2e2;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  margin: 8px 0 0 0;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f7fafc;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #718096;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #2d3748;
}

.modal-body {
  padding: 24px;
}

.modal-text {
  font-size: 1rem;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.modal-subtext {
  font-size: 0.9rem;
  color: #718096;
  margin: 0 0 20px 0;
}

.form-group {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.form-control {
  width: 100%;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
}

.btn {
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.9rem;
}

.btn-danger {
  background: #dc2626;
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-danger:hover {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.btn-outline-secondary {
  border: 1.5px solid #cbd5e0;
  color: #4a5568;
  background: white;
}

.btn-outline-secondary:hover {
  background: #f7fafc;
  border-color: #2d3748;
}

/* Responsive */
@media (max-width: 1024px) {
  .reviews-layout {
    grid-template-columns: 1fr;
  }

  .users-panel {
    height: auto;
    max-height: none;
  }

  .users-list {
    max-height: 300px;
  }

  .reviews-list {
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.75rem;
  }

  .panel-title {
    font-size: 1.1rem;
  }

  .review-card {
    padding: 16px;
  }

  .search-input {
    font-size: 0.9rem;
  }
}
</style>
