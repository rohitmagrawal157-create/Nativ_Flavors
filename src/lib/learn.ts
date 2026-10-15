import { API_BASE_URL } from '@/lib/env'

export type GuideCard = {
  id: string
  title: string
  summary: string
  imageUrl: string
  slug: string
  publishedAt: string
}

export type GuideStep = {
  title: string
  text: string
}

export type GuideDetail = GuideCard & {
  intro: string
  paragraphs: string[]
  steps: GuideStep[]
  labelChecks: string[]
}

type Row = Record<string, unknown>

const LIST_PATHS = ['/api/articles', '/api/guides', '/api/blogs', '/api/posts']

function textFrom(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value != null && String(value).trim() !== '') return String(value).trim()
  }
  return ''
}

function asRecord(value: unknown): Row {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Row
  return {}
}

function asRows(json: unknown): Row[] {
  const root = asRecord(json)
  const data = root.data ?? root.articles ?? root.guides ?? root.posts ?? json
  if (Array.isArray(data)) return data.map(asRecord)
  const nested = asRecord(data)
  const list = nested.data ?? nested.articles ?? nested.guides ?? nested.posts
  if (Array.isArray(list)) return list.map(asRecord)
  if (textFrom(nested, ['title', 'name'])) return [nested]
  return []
}

function mediaUrl(raw: string) {
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `${API_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isPublished(row: Row) {
  const status = String(row.status ?? row.is_published ?? row.published ?? 'published').toLowerCase()
  return status !== '0' && status !== 'false' && status !== 'draft' && status !== 'inactive' && status !== 'unpublished'
}

function publishedTime(row: Row) {
  const raw = textFrom(row, ['published_at', 'created_at', 'updated_at', 'date'])
  const time = Date.parse(raw)
  return Number.isNaN(time) ? 0 : time
}

function cardFrom(row: Row): GuideCard | null {
  const title = textFrom(row, ['title', 'name', 'heading'])
  if (!title) return null
  const slug = textFrom(row, ['slug']) || slugify(title)
  if (!slug) return null
  return {
    id: textFrom(row, ['id', 'article_id']) || slug,
    title,
    summary: textFrom(row, ['summary', 'excerpt', 'short_description', 'description']),
    imageUrl: mediaUrl(textFrom(row, ['image_url', 'image', 'thumbnail', 'cover', 'photo'])),
    slug,
    publishedAt: textFrom(row, ['published_at', 'created_at', 'date']),
  }
}

function asSteps(value: unknown): GuideStep[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return { title: '', text: item.trim() }
      const row = asRecord(item)
      return {
        title: textFrom(row, ['title', 'heading', 'name']),
        text: textFrom(row, ['text', 'description', 'body', 'content', 'detail']),
      }
    })
    .filter((step) => step.title || step.text)
}

function asChecks(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : textFrom(asRecord(item), ['text', 'title', 'label', 'name'])))
    .filter(Boolean)
}

function asParagraphs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : textFrom(asRecord(item), ['text', 'body', 'content'])))
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(/\n{2,}/)
      .map((part) => part.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
  }
  return []
}

async function readJson(path: string) {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: 'application/json' } })
  const json = await res.json().catch(() => null)
  const missing = String((json as { error?: string } | null)?.error ?? '').toLowerCase().includes('could not be found')
  return { res, json, missing }
}

/** Latest published guides first. Throws when the articles feed cannot be reached. */
export async function loadGuides(): Promise<GuideCard[]> {
  let unavailable = 0
  for (const path of LIST_PATHS) {
    const { res, json, missing } = await readJson(path)
    if (missing) {
      unavailable += 1
      continue
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return asRows(json)
      .filter(isPublished)
      .sort((a, b) => publishedTime(b) - publishedTime(a))
      .map(cardFrom)
      .filter((card): card is GuideCard => Boolean(card))
  }
  // No articles table yet: show the empty state, not a broken section.
  if (unavailable === LIST_PATHS.length) return []
  return []
}

export async function loadGuide(slug: string): Promise<GuideDetail | null> {
  const code = encodeURIComponent(slug)
  const paths = [`/api/articles/${code}`, `/api/guides/${code}`, `/api/blogs/${code}`, `/api/posts/${code}`]
  let unavailable = 0

  for (const path of paths) {
    const { res, json, missing } = await readJson(path)
    if (missing) {
      unavailable += 1
      continue
    }
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const row = asRecord((json as { data?: unknown } | null)?.data ?? json)
    if (!textFrom(row, ['title', 'name', 'heading'])) return null
    const card = cardFrom(row)
    if (!card) return null
    const intro = textFrom(row, ['intro', 'introduction', 'excerpt', 'summary'])
    return {
      ...card,
      intro,
      paragraphs: asParagraphs(row.body ?? row.content ?? row.paragraphs).filter((part) => part !== intro),
      steps: asSteps(row.steps ?? row.tests ?? row.home_tests),
      labelChecks: asChecks(row.label_checks ?? row.checks ?? row.label),
    }
  }

  if (unavailable === paths.length) throw new Error('Guide lookup is not available')
  return null
}

export function formatDate(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}
