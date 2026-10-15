import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingRoot: root,
  async redirects() {
    return [
      { source: '/shop', destination: '/shop-v1', permanent: false },
      { source: '/product/:id', destination: '/product-details/:id', permanent: false },
    ]
  },
  reactStrictMode: true,
  images: {
    // Existing pages import png/jpg/svg the Vite way and expect a URL string.
    disableStaticImages: true,
  },
  env: Object.fromEntries(
    Object.entries({
      NEXT_PUBLIC_API_BASE_URL:
        process.env.NEXT_PUBLIC_API_BASE_URL || process.env.VITE_API_BASE_URL,
      NEXT_PUBLIC_RAZORPAY_KEY:
        process.env.NEXT_PUBLIC_RAZORPAY_KEY || process.env.VITE_RAZORPAY_KEY,
      NEXT_PUBLIC_CART_SESSION_ID:
        process.env.NEXT_PUBLIC_CART_SESSION_ID || process.env.VITE_CART_SESSION_ID,
    }).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ),
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|webp|avif|svg|ico)$/i,
      type: 'asset/resource',
    })
    return config
  },
}

export default nextConfig
