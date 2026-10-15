'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/account/wishlist'))

export default function Page() {
  return <View />
}
