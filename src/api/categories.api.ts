import { API_BASE_URL } from '@/lib/env'
import { apiClient } from './client'
import type { CategoryConfig, CategoryProduct } from '../data/categoryData'
import { getCategoryConfig, CATEGORIES } from '../data/categoryData'

type ApiResult<T> = { data: T; error: null } | { data: T; error: string }



export async function fetchCategoryConfig(slug: string): Promise<CategoryConfig | undefined> {
  try {
    const res = await apiClient.get<unknown>(`/categories/${slug}`)
    const payload = res.data as CategoryConfig
    if (payload && payload.slug) return payload
  } catch (err) {
    // ignore and fallback
  }

  return getCategoryConfig(slug)
}

// Updated: accepts optional params (filters, pagination, sorting) and returns { data, error }
export async function fetchCategoryProducts(slug: string, params: Record<string, unknown> = {}): Promise<ApiResult<CategoryProduct[]>> {
  try {
    const res = await apiClient.get<unknown>(`/categories/${slug}/products`, { params })
    const payload = res.data

    // If API returns array directly
    if (Array.isArray(payload)) {
      return { data: payload as CategoryProduct[], error: null }
    }

    // If API returns wrapper { products: [...] }
    if (payload && typeof payload === 'object' && Array.isArray((payload as any).products)) {
      return { data: (payload as any).products as CategoryProduct[], error: null }
    }

    // Some APIs may return { data: [...] }
    if (payload && typeof payload === 'object' && Array.isArray((payload as any).data)) {
      return { data: (payload as any).data as CategoryProduct[], error: null }
    }

    // Unexpected shape: fall through to fallback
  } catch (err: any) {
    // Log for dev visibility
    // eslint-disable-next-line no-console
    console.warn('fetchCategoryProducts: api request failed, falling back to local data', err?.message ?? err)
  }

  // Fallback to local CATEGORIES map
  const fallback = CATEGORIES[slug]?.products ?? []
  return { data: fallback as CategoryProduct[], error: 'Using fallback data' }
}

// Fetch list of categories from server. Falls back to local `CATEGORIES` map on error.
export async function listCategories(): Promise<{ data: CategoryConfig[]; error: null | string }> {
  const externalUrl =
    `${API_BASE_URL}/api/categories`

  try {
    const res = await apiClient.get<unknown>(externalUrl)
    const payload = res.data

    if (Array.isArray(payload)) return { data: payload as CategoryConfig[], error: null }
    if (payload && Array.isArray((payload as any).data)) return { data: (payload as any).data as CategoryConfig[], error: null }

    // Unexpected but non-error response — try to coerce
    return { data: (payload as any) as CategoryConfig[], error: null }
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.warn('listCategories: request failed, using local fallback', err?.message ?? err)
    return { data: Object.values(CATEGORIES), error: 'Using fallback data' }
  }
}

// Create a new category on the server. Returns created category object.
export async function createCategory(body: Partial<CategoryConfig>): Promise<CategoryConfig> {
  const externalUrl =
    `${API_BASE_URL}/api/categories`

  const res = await apiClient.post<any>(externalUrl, body)
  const data = res.data

  if (!data) throw new Error('Empty response from server')

  return data as CategoryConfig
}

export default {
  fetchCategoryConfig,
  fetchCategoryProducts,
}
