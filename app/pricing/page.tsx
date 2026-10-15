'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/inner-pages/pricing'))

export default function Page() {
  return <View />
}
