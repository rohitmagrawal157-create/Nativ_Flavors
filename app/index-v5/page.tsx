'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/index/index-five'))

export default function Page() {
  return <View />
}
