<template>
  <div class="container py-5">
    <!-- Back to listings if not authenticated -->
    <div v-if="!auth.isAuthenticated" class="alert alert-warning">
      <p>Please <RouterLink to="/login">log in</RouterLink> to view your profile.</p>
    </div>

    <!-- User Info Header -->
    <div v-else class="mb-5">
      <div class="card shadow-sm">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-8">
              <h1 class="card-title mb-2">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</h1>
              <p class="text-muted mb-0">@{{ auth.user?.username }}</p>
              <p class="text-muted mb-0">{{ auth.user?.email }}</p>
            </div>
            <div class="col-md-4 text-end">
              <span class="badge bg-primary">{{ userType }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs for content -->
    <div v-if="auth.isAuthenticated">
      <ul class="nav nav-tabs mb-4" role="tablist">
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'listings' }"
            @click="activeTab = 'listings'"
            type="button"
            role="tab"
          >
            <i class="bi bi-bookmark-fill"></i> My Listings
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'pets' }"
            @click="activeTab = 'pets'"
            type="button"
            role="tab"
          >
            <i class="bi bi-paw-fill"></i> My Pets
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'add-pet' }"
            @click="activeTab = 'add-pet'"
            type="button"
            role="tab"
          >
            <i class="bi bi-plus-circle-fill"></i> Add Pet
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'favorites' }"
            @click="activeTab = 'favorites'"
            type="button"
            role="tab"
          >
            <i class="bi bi-heart-fill"></i> Favorites
          </button>
        </li>
        <li v-if=" pets.length > 0" class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'create-listing' }"
            @click="activeTab = 'create-listing'"
            type="button"
            role="tab"
          >
            <i class="bi bi-plus-circle-fill"></i> Create Listing
          </button>
        </li>
      </ul>

      <!-- Listings Tab -->
      <div v-if="activeTab === 'listings'" class="tab-pane active">
        <h2 class="mb-4">My Listings</h2>
        <div v-if="listings.length === 0" class="alert alert-info">
          <p  class="mb-0">
            You haven't created any listings yet.
            <a href="#" @click.prevent="activeTab = 'create-listing'">Create your first listing!</a>
          </p>

        </div>
        <div  class="row g-4">
          <div v-for="listing in listings" :key="listing.listingId" class="col-md-6 col-lg-4">
            <div class="card h-100 shadow-sm listing-card">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">Animal ID: {{ listing.animalId }}</h5>
                <p class="card-text text-muted">{{ listing.description }}</p>
                <div class="mt-auto">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="badge" :class="getStatusBadgeClass(listing.status)">
                      {{ listing.status }}
                    </span>
                    <strong class="text-primary">${{ listing.price }}</strong>
                  </div>
                  <small class="text-muted d-block mb-3">
                    Created: {{ formatDate(listing.createdAt) }}
                  </small>
                  <div class="d-flex gap-2">
                    <select
                      v-model="listing.status"
                      @change="updateStatus(listing)"
                      class="form-select form-select-sm flex-grow-1"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SOLD">Sold</option>
                    </select>
                    <button
                      @click="deleteListing_(listing.listingId)"
                      class="btn btn-sm btn-danger"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pets Tab -->
      <div v-if="activeTab === 'pets'" class="tab-pane active">
        <h2 class="mb-4">My Pets</h2>
        <div v-if="pets.length === 0" class="alert alert-info">
          <p class="mb-0">You don't have any pets yet. Add pets to create listings!</p>
        </div>
        <div v-else class="row g-4">
          <div v-for="pet in pets" :key="pet.animalId" class="col-md-6 col-lg-4">
            <div class="card h-100 shadow-sm pet-card">
              <div class="card-body">
                <h5 class="card-title">{{ pet.name }}</h5>
                <p class="card-text">
                  <strong>Type:</strong> {{ pet.type }}<br>
                  <strong>Species:</strong> {{ pet.species }}<br>
                  <span v-if="pet.breed"><strong>Breed:</strong> {{ pet.breed }}<br></span>
                  <span v-if="pet.sex"><strong>Sex:</strong> {{ pet.sex }}<br></span>
                  <span v-if="pet.dateOfBirth"><strong>DOB:</strong> {{ formatDate(pet.dateOfBirth) }}<br></span>
                  <span v-if="pet.locatedName"><strong>Location:</strong> {{ pet.locatedName }}<br></span>
                </p>
                <button
                  v-if="isOwner"
                  @click="selectPetForListing(pet)"
                  class="btn btn-sm btn-primary w-100"
                >
                  Create Listing for {{ pet.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Listing Tab (Owner Only with Pets) -->
      <div v-if="activeTab === 'create-listing'" class="tab-pane active">
        <h2 class="mb-4">Create New Listing</h2>

        <div v-if="pets.length === 0" class="alert alert-warning">
          <p class="mb-0">
            You need to have at least one pet to create a listing.
            Go to the <a href="#" @click.prevent="activeTab = 'pets'">My Pets</a> tab to add your first pet.
          </p>
        </div>

        <div v-else class="card shadow-sm">
          <div class="card-body">
            <form @submit.prevent="submitListing">
              <div class="mb-3">
                <label for="petSelect" class="form-label">Select Pet</label>
                <select
                  v-model.number="newListing.animalId"
                  id="petSelect"
                  class="form-select"
                  required
                >
                  <option value="">Choose a pet...</option>
                  <option v-for="pet in pets" :key="pet.animalId" :value="pet.animalId">
                    {{ pet.name }} ({{ pet.species }})
                  </option>
                </select>
              </div>

              <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea
                  v-model="newListing.description"
                  id="description"
                  class="form-control"
                  rows="4"
                  placeholder="Describe your pet and why they're available..."
                  required
                ></textarea>
              </div>

              <div class="mb-3">
                <label for="price" class="form-label">Price</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                    v-model.number="newListing.price"
                    type="number"
                    id="price"
                    class="form-control"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div v-if="errorMessage" class="alert alert-danger">
                {{ errorMessage }}
              </div>

              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isSubmitting ? 'Creating...' : 'Create Listing' }}
                </button>
                <button
                  type="button"
                  @click="resetForm"
                  class="btn btn-secondary"
                  :disabled="isSubmitting"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Add Pet Tab -->
      <div v-if="activeTab === 'add-pet'" class="tab-pane active">
        <h2 class="mb-4">Add New Pet</h2>
        <div class="card shadow-sm">
          <div class="card-body">
            <form @submit.prevent="submitPet">
              <div class="mb-3">
                <label for="petName" class="form-label">Pet Name <span class="text-danger">*</span></label>
                <input
                  v-model="newPet.name"
                  type="text"
                  id="petName"
                  class="form-control"
                  placeholder="e.g., Buddy"
                  required
                />
              </div>

              <div class="mb-3">
                <label for="petSex" class="form-label">Sex <span class="text-danger">*</span></label>
                <select
                  v-model="newPet.sex"
                  id="petSex"
                  class="form-select"
                  required
                >
                  <option value="">Select sex...</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>

              <div class="mb-3">
                <label for="petType" class="form-label">Type <span class="text-danger">*</span></label>
                <input
                  v-model="newPet.type"
                  type="text"
                  id="petType"
                  class="form-control"
                  placeholder="e.g., PET"
                  required
                />
              </div>

              <div class="mb-3">
                <label for="petSpecies" class="form-label">Species <span class="text-danger">*</span></label>
                <select
                  v-model="newPet.species"
                  id="petSpecies"
                  class="form-select"
                  required
                >
                  <option value="">Select a species...</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Bird">Bird</option>
                  <option value="Rabbit">Rabbit</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Guinea Pig">Guinea Pig</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div class="mb-3">
                <label for="petBreed" class="form-label">Breed</label>
                <input
                  v-model="newPet.breed"
                  type="text"
                  id="petBreed"
                  class="form-control"
                  placeholder="e.g., Golden Retriever"
                />
              </div>

              <div class="mb-3">
                <label for="petDateOfBirth" class="form-label">Date of Birth</label>
                <input
                  v-model="newPet.dateOfBirth"
                  type="date"
                  id="petDateOfBirth"
                  class="form-control"
                />
              </div>

              <div class="mb-3">
                <label for="petPhotoUrl" class="form-label">Photo URL</label>
                <input
                  v-model="newPet.photoUrl"
                  type="url"
                  id="petPhotoUrl"
                  class="form-control"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div class="mb-3">
                <label for="petLocatedName" class="form-label">Location</label>
                <input
                  v-model="newPet.locatedName"
                  type="text"
                  id="petLocatedName"
                  class="form-control"
                  placeholder="e.g., Skopje"
                />
              </div>

              <div v-if="errorMessage" class="alert alert-danger">
                {{ errorMessage }}
              </div>

              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary" :disabled="isPetSubmitting">
                  <span v-if="isPetSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isPetSubmitting ? 'Adding Pet...' : 'Add Pet' }}
                </button>
                <button
                  type="button"
                  @click="resetPetForm"
                  class="btn btn-secondary"
                  :disabled="isPetSubmitting"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Favorites Tab -->
      <div v-if="activeTab === 'favorites'" class="tab-pane active">
        <h2 class="mb-4">Favorite Listings</h2>
        <div v-if="favorites.length === 0" class="alert alert-info">
          <p class="mb-0">You haven't added any favorites yet. Browse listings and click the heart icon to save them!</p>
        </div>
        <div v-else class="row g-4">
          <div v-for="listing in favorites" :key="listing.listingId" class="col-md-6 col-lg-4">
            <div class="card h-100 shadow-sm listing-card">
              <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h5 class="card-title">Animal ID: {{ listing.animalId }}</h5>
                  <button
                    @click="removeFavorite(listing.listingId)"
                    class="btn btn-sm btn-link text-danger p-0"
                    title="Remove from favorites"
                  >
                    <i class="bi bi-heart-fill"></i>
                  </button>
                </div>
                <p class="card-text text-muted">{{ listing.description }}</p>
                <div class="mt-auto">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="badge" :class="getStatusBadgeClass(listing.status)">
                      {{ listing.status }}
                    </span>
                    <strong class="text-primary">${{ listing.price }}</strong>
                  </div>
                  <small class="text-muted d-block">
                    Created: {{ formatDate(listing.createdAt) }}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  getUserListings,
  getUserPets,
  createListing,
  createPet,
  deleteListing,
  updateListingStatus,
} from '../api/profile'
import { getFavoritedListings, removeFavorite as removeFavoriteAPI } from '../api/favorites'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref<'listings' | 'pets' | 'add-pet' | 'create-listing' | 'favorites'>('listings')
const listings = ref<any[]>([])
const pets = ref<any[]>([])
const favorites = ref<any[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const isPetSubmitting = ref(false)
const errorMessage = ref('')

const newListing = ref({
  animalId: null as number | null,
  description: '',
  price: null as number | null,
})

const newPet = ref({
  name: '',
  sex: '',
  dateOfBirth: '',
  photoUrl: '',
  type: 'PET',
  species: '',
  breed: '',
  locatedName: '',
})

const isOwner = computed(() => {
  return auth.user?.userType === 'OWNER'
})

const userType = computed(() => {
  return auth.user?.userType || 'Unknown'
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-success'
    case 'INACTIVE':
      return 'bg-secondary'
    case 'SOLD':
      return 'bg-danger'
    default:
      return 'bg-warning'
  }
}

async function loadListings() {
  if (!auth.user?.userId) return
  try {
    isLoading.value = true
    listings.value = await getUserListings(auth.user.userId)
  } catch (error) {
    console.error('Failed to load listings:', error)
  } finally {
    isLoading.value = false
  }
}

async function loadPets() {
  if (!auth.user?.userId) return
  try {
    isLoading.value = true
    pets.value = await getUserPets(auth.user.userId)
  } catch (error) {
    console.error('Failed to load pets:', error)
    // If no pets exist, just show empty list
    pets.value = []
  } finally {
    isLoading.value = false
  }
}

async function submitListing() {
  if (!auth.user?.userId || !newListing.value.animalId || !newListing.value.price) {
    errorMessage.value = 'Please fill in all required fields'
    return
  }

  try {
    isSubmitting.value = true
    errorMessage.value = ''

    await createListing(auth.user.userId, {
      animalId: newListing.value.animalId,
      description: newListing.value.description,
      price: newListing.value.price,
    })

    // Reload listings
    await loadListings()
    resetForm()
    activeTab.value = 'listings'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to create listing'
  } finally {
    isSubmitting.value = false
  }
}

async function updateStatus(listing: any) {
  if (!auth.user?.userId) return

  try {
    await updateListingStatus(auth.user.userId, listing.listingId, listing.status)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to update listing'
    await loadListings()
  }
}

async function deleteListing_(listingId: number) {
  if (!auth.user?.userId) return

  if (!confirm('Are you sure you want to delete this listing?')) return

  try {
    await deleteListing(auth.user.userId, listingId)
    await loadListings()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to delete listing'
  }
}

function selectPetForListing(pet: any) {
  newListing.value.animalId = pet.animalId
  activeTab.value = 'create-listing'
}

function resetForm() {
  newListing.value = {
    animalId: null,
    description: '',
    price: null,
  }
  errorMessage.value = ''
}

async function submitPet() {
  if (!auth.user?.userId || !newPet.value.name || !newPet.value.sex || !newPet.value.type || !newPet.value.species) {
    errorMessage.value = 'Please fill in pet name, sex, type, and species'
    return
  }

  try {
    isPetSubmitting.value = true
    errorMessage.value = ''

    const petPayload = {
      name: newPet.value.name,
      sex: newPet.value.sex,
      dateOfBirth: newPet.value.dateOfBirth || undefined,
      photoUrl: newPet.value.photoUrl || undefined,
      type: newPet.value.type,
      species: newPet.value.species,
      breed: newPet.value.breed || undefined,
      locatedName: newPet.value.locatedName || undefined,
    }

    console.log('📤 Sending pet payload:', petPayload)
    console.log('User ID:', auth.user.userId)

    await createPet(auth.user.userId, petPayload)

    // Reload pets and promote user to owner if needed
    await loadPets()
    resetPetForm()
    activeTab.value = 'pets'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to add pet'
  } finally {
    isPetSubmitting.value = false
  }
}

function resetPetForm() {
  newPet.value = {
    name: '',
    sex: '',
    dateOfBirth: '',
    photoUrl: '',
    type: 'PET',
    species: '',
    breed: '',
    locatedName: '',
  }
  errorMessage.value = ''
}

async function loadFavorites() {
  if (!auth.user?.userId) return
  try {
    isLoading.value = true
    favorites.value = await getFavoritedListings(auth.user.userId)
  } catch (error) {
    console.error('Failed to load favorites:', error)
    favorites.value = []
  } finally {
    isLoading.value = false
  }
}

async function removeFavorite(listingId: number) {
  if (!auth.user?.userId) return

  try {
    await removeFavoriteAPI(auth.user.userId, listingId)
    await loadFavorites()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to remove favorite'
  }
}

onMounted(() => {
  if (!auth.isAuthenticated) {
    router.push('/login')
    return
  }

  loadListings()
  loadPets()
  loadFavorites()
})
</script>

<style scoped>
.listing-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.listing-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.pet-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.pet-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.nav-tabs .nav-link {
  color: #6c757d;
  border: none;
  border-bottom: 2px solid transparent;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-tabs .nav-link:hover {
  color: #495057;
  border-bottom-color: #dee2e6;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
  background: none;
}

.card {
  border-radius: 8px;
  border: 1px solid #e9ecef;
}
</style>
