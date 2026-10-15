'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/special/thank-you'))

export default function Page() {
  return <View />
}
