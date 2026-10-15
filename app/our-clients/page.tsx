'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/inner-pages/our-clients'))

export default function Page() {
  return <View />
}
