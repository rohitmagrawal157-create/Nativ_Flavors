const DEFAULT_API_BASE =
  'https://lightsteelblue-stinkbug-893971.hostingersite.com/Shopping-Cart/public'

const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()

/** Public API origin. Set NEXT_PUBLIC_API_BASE_URL to point at another backend. */
export const API_BASE_URL = (configured || DEFAULT_API_BASE).replace(/\/$/, '')
