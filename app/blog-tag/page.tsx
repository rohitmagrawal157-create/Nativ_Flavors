'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/blog/blog-tag'))

export default function Page() {
  return <View />
}
