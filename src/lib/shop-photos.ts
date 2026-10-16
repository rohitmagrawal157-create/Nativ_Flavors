import { API_BASE_URL } from '@/lib/env'

export type ShopPhoto = { src: string; name: string }

type PhotoRow = {
  name?: string
  title?: string
  images?: unknown
  image_url?: string
  image?: string
  id?: number | string
}

function mediaUrl(raw: string) {
  if (!raw) return ''
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw
  return `${API_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function photoOf(row: PhotoRow): ShopPhoto {
  const images = Array.isArray(row.images) ? row.images : []
  const raw = String(images[0] || row.image_url || row.image || '')
  return { src: mediaUrl(raw), name: String(row.name || row.title || '') }
}

function unique(rows: ShopPhoto[]) {
  return rows.filter((photo, index, all) => photo.src && all.findIndex((item) => item.src === photo.src) === index)
}

async function rowsFrom(url: string) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const json = await res.json()
  return Array.isArray(json?.data) ? (json.data as PhotoRow[]) : []
}

/** Product photos from the shop. Retries the main list, then each category. */
export async function loadShopPhotos(): Promise<ShopPhoto[]> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const photos = unique((await rowsFrom(`${API_BASE_URL}/api/products`)).map(photoOf))
      if (photos.length) return photos
    } catch {
      // The product list sometimes drops while the shop database reconnects.
    }
    if (attempt < 2) await wait(350 * (attempt + 1))
  }

  try {
    const categories = await rowsFrom(`${API_BASE_URL}/api/categories`)
    const ids = categories.map((row) => row.id).filter((id) => id != null && id !== '')
    const groups = await Promise.all(
      ids.map((id) => rowsFrom(`${API_BASE_URL}/api/categories/${id}/products`).catch(() => [] as PhotoRow[])),
    )
    return unique(groups.flat().map(photoOf))
  } catch {
    return []
  }
}
