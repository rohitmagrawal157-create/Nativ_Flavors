'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/shop/category-group'))

export default function Page() {
  return <View />
}
