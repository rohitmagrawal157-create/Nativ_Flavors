'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/inner-pages/faq'))

export default function Page() {
  return <View />
}
