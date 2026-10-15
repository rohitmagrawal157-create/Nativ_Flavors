'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/account/my-profile'))

export default function Page() {
  return <View />
}
