'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/portfolio/portfolio-v3'))

export default function Page() {
  return <View />
}
