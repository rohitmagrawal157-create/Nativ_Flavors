'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/category/WallMurals'))

export default function Page() {
  return <View />
}
