'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/category/CustomizeBlinds'))

export default function Page() {
  return <View />
}
