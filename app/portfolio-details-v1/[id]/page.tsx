'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/portfolio/portfolio-details-v1'))

export default function Page() {
  return <View />
}
