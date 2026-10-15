'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/auth/login'))

export default function Page() {
  return <View />
}
