'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/category/PortraitFrames'))

export default function Page() {
  return <View />
}
