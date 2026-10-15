'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/index/index-six'))

export default function Page() {
  return <View />
}
