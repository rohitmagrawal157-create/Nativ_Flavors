'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/learn/article'))

export default function Page() {
  return <View />
}
