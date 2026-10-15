import { API_BASE_URL } from '@/lib/env'

export type TrustSettings = {
  fssaiNumber: string
  sampleReportUrl: string
}

export type BatchRecord = {
  batchNumber: string
  product: string
  packingDate: string
  bestBefore: string
}

type Row = Record<string, unknown>

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

/** One place for the license number and the sample report. Settings API first, then public env. */
export async function loadTrustSettings(): Promise<TrustSettings> {
  const fromEnv: TrustSettings = {
    fssaiNumber: process.env.NEXT_PUBLIC_FSSAI_NUMBER?.trim() || '',
    sampleReportUrl: process.env.NEXT_PUBLIC_SAMPLE_REPORT_URL?.trim() || '',
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings`, { headers: { Accept: 'application/json' } })
    if (!res.ok) return fromEnv
    const json = await res.json()
    const row = asRecord(json?.data ?? json)
    return {
      fssaiNumber: textFrom(row, ['fssai_number', 'fssai_license', 'fssai', 'license_no', 'license_number']) || fromEnv.fssaiNumber,
      sampleReportUrl: textFrom(row, ['sample_report_url', 'lab_report_url', 'sample_report', 'report_url']) || fromEnv.sampleReportUrl,
    }
  } catch {
    return fromEnv
  }
}

function mapBatch(row: Row, fallbackNumber: string): BatchRecord | null {
  const batchNumber = textFrom(row, ['batch_number', 'batch_no', 'number', 'code']) || fallbackNumber
  const product = textFrom(row, ['product', 'product_name', 'name'])
  const packingDate = textFrom(row, ['packing_date', 'packed_on', 'pack_date', 'manufacturing_date'])
  const bestBefore = textFrom(row, ['best_before', 'best_before_date', 'expiry_date', 'expiry'])
  if (!product && !packingDate && !bestBefore) return null
  return { batchNumber, product, packingDate, bestBefore }
}

export async function lookupBatch(batchNumber: string): Promise<BatchRecord | null> {
  const code = encodeURIComponent(batchNumber.trim())
  const paths = [`/api/batches/${code}`, `/api/batch/${code}`, `/api/trace/${code}`]
  let unavailable = 0

  for (const path of paths) {
    const res = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: 'application/json' } })
    const json = await res.json().catch(() => null)
    const missingRoute = String(json?.error ?? '').toLowerCase().includes('could not be found')
    if (missingRoute) {
      unavailable += 1
      continue
    }
    if (res.status === 404 || json?.status === false) return null
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = json?.data ?? json
    const row = Array.isArray(data) ? asRecord(data[0]) : asRecord(data)
    return mapBatch(row, batchNumber.trim())
  }

  if (unavailable === paths.length) throw new Error('Batch lookup is not available')
  return null
}
