'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/auth/forger-password'))

export default function Page() {
  return <View />
}
