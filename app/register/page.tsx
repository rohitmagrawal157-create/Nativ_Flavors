'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/auth/register'))

export default function Page() {
  return <View />
}
