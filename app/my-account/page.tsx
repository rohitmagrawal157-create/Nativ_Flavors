'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/account/my-account'))

export default function Page() {
  return <View />
}
