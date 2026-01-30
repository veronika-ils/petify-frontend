function getBaseUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
  return base.replace(/\/$/, '')
}

function joinUrl(base: string, path: string): string {
  if (!base) return path
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

export interface UserProfile {
  userId: number
  username: string
  email: string
  firstName: string
  lastName: string
}

export interface Pet {
  animalId: number
  name: string
  species: string
  breed?: string
  age?: number
  description?: string
}

export async function getUserListings(userId: number): Promise<any[]> {
  const url = joinUrl(getBaseUrl(), `/api/listings/my-listings`)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(userId),
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch listings: ${response.statusText}`)
  }

  return await response.json()
}

export async function getUserPets(userId: number): Promise<Pet[]> {
  const url = joinUrl(getBaseUrl(), `/api/users/${userId}/pets`)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(userId),
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch pets: ${response.statusText}`)
  }

  return await response.json()
}

export async function createListing(
  userId: number,
  data: {
    animalId: number
    description: string
    price: number
  }
): Promise<any> {
  const url = joinUrl(getBaseUrl(), `/api/listings`)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(userId),
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to create listing: ${response.statusText}`)
  }

  return await response.json()
}

export async function deleteListing(userId: number, listingId: number): Promise<void> {
  const url = joinUrl(getBaseUrl(), `/api/listings/${listingId}`)
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(userId),
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to delete listing: ${response.statusText}`)
  }
}

export async function updateListingStatus(
  userId: number,
  listingId: number,
  status: string
): Promise<any> {
  const url = joinUrl(getBaseUrl(), `/api/listings/${listingId}/status`)
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(userId),
    },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to update listing: ${response.statusText}`)
  }

  return await response.json()
}
