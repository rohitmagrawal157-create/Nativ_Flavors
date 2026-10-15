'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

function PageLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        color: '#2F4A3A',
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 14,
        letterSpacing: '0.04em',
      }}
    >
      Loading Infinity HomeDecor…
    </div>
  )
}

/** Load an existing page only in the browser. These screens read localStorage during render. */
export function clientPage(loader: () => Promise<{ default: ComponentType }>) {
  return dynamic(loader, { ssr: false, loading: PageLoading })
}
