'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/special/error'))

export default function Page() {
  return <View />
}
