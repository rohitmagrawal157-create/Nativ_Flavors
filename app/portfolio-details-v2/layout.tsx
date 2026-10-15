import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: "Portfolio Details",
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
