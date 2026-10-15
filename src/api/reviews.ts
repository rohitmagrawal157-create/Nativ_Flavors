import { apiClient } from './client'

export interface Review {
  id: number
  product_id: number
  name?: string
  rating: number
  title?: string
  body?: string
  date?: string
  user?: { id?: number; name?: string }
}

function parseReview(raw: any): Review {
  return {
    id: Number(raw.id ?? raw.review_id ?? 0),
    product_id: Number(raw.product_id ?? raw.productId ?? 0),
    name: raw.name ?? raw.user?.name ?? raw.user_name ?? '',
    rating: Number(raw.rating ?? raw.rate ?? 0),
    title: raw.title ?? raw.headline ?? '',
    body: raw.body ?? raw.comment ?? raw.review ?? '',
    date: raw.created_at ?? raw.date ?? new Date().toISOString(),
    user: raw.user ? { id: raw.user.id, name: raw.user.name } : undefined,
  }
}

export async function getReviewsByProduct(productId: number): Promise<Review[]> {
  if (!Number.isFinite(productId) || productId <= 0) return []
  try {
    const res = await apiClient.get<unknown>(`/api/reviews/${productId}`)
    const payload = res.data
    let items: any[] = []
    if (Array.isArray(payload)) items = payload as any[]
    else if (payload && typeof payload === 'object') {
      const p: any = payload
      if (Array.isArray(p.data)) items = p.data
      else if (Array.isArray(p.reviews)) items = p.reviews
    }
    return items.map(parseReview)
  } catch (err) {
    console.warn('[reviews.api] getReviewsByProduct failed', err)
    return []
  }
}

export async function addReview(payload: { product_id: number; rating: number; title?: string; body?: string; name?: string }): Promise<Review | null> {
  try {
    const res = await apiClient.post('/api/reviews', payload)
    const data = res.data
    if (!data) return null
    if (Array.isArray(data)) return parseReview(data[0])
    if (data && typeof data === 'object') {
      // accept both { data: { ... } } and direct object
      const candidate = data.data ?? data
      return parseReview(candidate)
    }
    return null
  } catch (err) {
    console.warn('[reviews.api] addReview failed', err)
    throw err
  }
}

export async function deleteReview(id: number): Promise<boolean> {
  if (!Number.isFinite(id) || id <= 0) return false
  try {
    await apiClient.delete(`/api/reviews/${id}`)
    return true
  } catch (err) {
    console.warn('[reviews.api] deleteReview failed', err)
    return false
  }
}

export default { getReviewsByProduct, addReview, deleteReview }
