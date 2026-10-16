'use client'

// src/screens/home/Index.tsx
// ══════════════════════════════════════════════════════════════════
//  ALL logic, imports, components, and structure UNCHANGED.
//
//  CHANGED (colors only — brand palette from infinity logo):
//
//  "New Products" heading      → gradient text (purple→red→orange)
//  "Why you Choose Us" heading → gradient text
//  "Trusted Partner" heading   → gradient text
//  Section body text size      → 15px (was implicit default)
//  "All Products" CTA button   → gradient background
//  Section icon imgs           → subtle drop-shadow with brand color
//  Section top accent line     → 3px gradient rule above each heading
// ══════════════════════════════════════════════════════════════════
import { useEffect } from 'react';
// import { Link } from '@/lib/router';

import NavbarOne from '../../components/navbar/navbar-one'
import SliderOne from '../../components/banner-slider/slider-one';
// import LayoutOne from '../../components/product/layout-one';
import FooterOne from '../../components/footer/footer-one';
// import PartnerOne from '../../components/partner-one';
import ScrollToTop from '../../components/scroll-to-top';

// import { featureOne, productList } from '../../data/data';
import 'tiny-slider/dist/tiny-slider.css';

// import sofa from '../../assets/img/svg/sofa.svg'
// import shape1 from '../../assets/img/home-v1/shape-01.png'
// import like from '../../assets/img/svg/like.svg'
// import trust from '../../assets/img/png/trust.png'
// import thumb from '../../assets/img/thumb/thumb.png'
// import newImg from '../../assets/img/png/new.png'

import AOS from 'aos';
import FeaturedProducts from '../../components/allproduct/FeaturedProducts';
import ProductCategorySlider from '../../components/allproduct/productcategoryslider';
import ProductCollection from '../../components/allproduct/ProductCollection';
import SuggestedForYou from '../../components/allproduct/SuggestedForYou';
import WidestCollection from '../../components/allproduct/WidestCollection';
import GrabOrGone from '../../components/allproduct/GrabOrGone';
import CategoryIconsRow from '../../components/allproduct/CategoryIconsRow';
import TrendsYouMayLike from '../../components/allproduct/TrendsYouMayLike';
import TrustSection from '../../components/allproduct/TrustSection';
import { LearnSection } from '../../components/allproduct/learn';
import NewProducts from '../../components/allproduct/NewProducts';
import HomeMotion from '../../components/home/home-motion';

// ── Brand color tokens ────────────────────────────────────────────
// const BRAND_GRAD = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';
// const CTA_GRAD = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';
// const BRAND_GRAD_H = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';

// Gradient text helper
// const gradTxt = {
//   backgroundImage: BRAND_GRAD,
//   WebkitBackgroundClip: 'text' as const,
//   WebkitTextFillColor: 'transparent' as const,
//   backgroundClip: 'text' as const,
// };

// interface Feature { image: string; title: string; desc: string; }
// interface Product { id: number; image: string; tag: string; price: string; name: string; }

function Index() {
  useEffect(() => { AOS.init({ duration: 400, once: true, easing: 'ease' }); }, []);

  return (
    <>
      <div className="overflow-x-clip w-full">
        <NavbarOne />
        <HomeMotion>
          <SliderOne />
          <FeaturedProducts />
          <ProductCollection />
          <TrendsYouMayLike />
          <TrustSection />
          <LearnSection />
          {/* <ProductCategorySlider /> */}
          {/* <NewProducts /> */}
        </HomeMotion>

        {/* ── Why Choose Us ────────────────────────────────────────── */}
     

        {/* ── Product Collection ────────────────────────────────────── */}
        {/* <GrabOrGone /> */}
        {/* <CategoryIconsRow /> */}
        {/* <WidestCollection /> */}
        {/* <SuggestedForYou /> */}
        

        

        <HomeMotion>
          <FooterOne />
        </HomeMotion>
        <ScrollToTop />
      </div>
    </>
  );
}

export default Index;