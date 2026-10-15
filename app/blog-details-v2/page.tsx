'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/blog/blog-details-v2'))

export default function Page() {
  return <View />
}
