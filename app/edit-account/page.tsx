'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/account/edit-account'))

export default function Page() {
  return <View />
}
