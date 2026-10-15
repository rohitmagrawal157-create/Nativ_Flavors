'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/shop/checkout'))

export default function Page() {
  return <View />
}
