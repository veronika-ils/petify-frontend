function getBaseUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
  return base.replace(/\/$/, '')
}

function joinUrl(base: string, path: string): string {
  if (!base) return path
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

export interface Review {
  reviewId: number
  reviewerId: number
  reviewerName: string
  reviewerUsername: string
  rating: number
  comment: string
  createdAt: string
}

export async function createReview(
  targetUserId: number,
  userId: number,
  rating: number,
  comment: string
): Promise<Review> {
  const url = joinUrl(getBaseUrl(), `/api/reviews/${targetUserId}`)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(userId),
    },
    body: JSON.stringify({
      rating,
      comment,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create review')
  }

  return await response.json()
}

export async function getReviewsByOwner(targetUserId: number): Promise<Review[]> {
  const url = joinUrl(getBaseUrl(), `/api/reviews/${targetUserId}`)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch reviews')
  }

  return await response.json()
}
export async function deleteReview(reviewId: number, userId: number): Promise<void> {
  const url = joinUrl(getBaseUrl(), `/api/reviews/${reviewId}`)
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(userId),
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete review')
  }
}
