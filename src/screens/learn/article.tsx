'use client'

import NavbarOne from '@/components/navbar/navbar-one'
import FooterOne from '@/components/footer/footer-one'
import ScrollToTop from '@/components/scroll-to-top'
import LearnArticlePage from '@/components/allproduct/learn'
import { useParams } from '@/lib/router'

export default function LearnArticleScreen() {
  const { slug = '' } = useParams<{ slug: string }>()
  return (
    <>
      <NavbarOne />
      <LearnArticlePage slug={decodeURIComponent(slug)} />
      <FooterOne />
      <ScrollToTop />
    </>
  )
}
