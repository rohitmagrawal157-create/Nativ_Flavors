'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/category/NeonSigns'))

export default function Page() {
  return <View />
}
