'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/inner-pages/contact'))

export default function Page() {
  return <View />
}
