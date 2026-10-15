'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/trace/batch'))

export default function Page() {
  return <View />
}
