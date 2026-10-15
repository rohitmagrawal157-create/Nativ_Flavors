'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/account/order-history'))

export default function Page() {
  return <View />
}
