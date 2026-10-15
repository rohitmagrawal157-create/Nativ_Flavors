'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/index/index-four'))

export default function Page() {
  return <View />
}
