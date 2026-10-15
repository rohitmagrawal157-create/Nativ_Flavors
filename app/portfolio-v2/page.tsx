'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/portfolio/portfolio-v2'))

export default function Page() {
  return <View />
}
