'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/index/product-details'))

export default function Page() {
  return <View />
}
