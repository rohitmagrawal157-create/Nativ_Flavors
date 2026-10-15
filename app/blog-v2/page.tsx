'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/blog/blog-v2'))

export default function Page() {
  return <View />
}
