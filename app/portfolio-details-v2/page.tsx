'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/portfolio/portfolio-details-v2'))

export default function Page() {
  return <View />
}
