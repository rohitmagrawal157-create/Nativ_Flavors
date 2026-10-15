'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/category/CategoryPage'))

export default function Page() {
  return <View />
}
