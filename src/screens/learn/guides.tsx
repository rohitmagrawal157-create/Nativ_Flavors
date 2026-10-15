'use client'

import NavbarOne from '@/components/navbar/navbar-one'
import FooterOne from '@/components/footer/footer-one'
import ScrollToTop from '@/components/scroll-to-top'
import { LearnSection } from '@/components/allproduct/learn'

export default function LearnGuidesPage() {
  return (
    <>
      <NavbarOne />
      <LearnSection scope="all" />
      <FooterOne />
      <ScrollToTop />
    </>
  )
}
