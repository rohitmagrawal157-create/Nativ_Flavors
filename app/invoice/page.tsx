'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/shop/invoice'))

export default function Page() {
  return <View />
}
