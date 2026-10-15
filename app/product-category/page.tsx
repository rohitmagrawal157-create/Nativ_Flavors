'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/shop/product-category'))

export default function Page() {
  return <View />
}
