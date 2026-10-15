'use client'

// src/screens/inner-pages/Faq.tsx
import { Link } from '@/lib/router';
import { useEffect } from "react";

import NavbarOne from "../../components/navbar/navbar-one";
import FaqOne from "../../components/faq/faq-one";
import FaqTwo from "../../components/faq/faq-two";
import FaqThree from "../../components/faq/faq-three";
import FaqFour from "../../components/faq/faq-four";
import FooterOne from "../../components/footer/footer-one";
import ScrollToTop from "../../components/scroll-to-top";

import bg from '../../assets/img/shortcode/breadcumb.jpg';
import Aos from "aos";

// Brand tokens (matching about.tsx)
const BRAND = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';
const FONT  = "'DM Sans', sans-serif";

function GradText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={className} style={{
      background: BRAND,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      display: 'inline-block',
    }}>{children}</span>
  );
}

export default function Faq() {
  useEffect(() => {
    Aos.init({ once: true, duration: 600 });
  }, []);

  return (
    <>
      <NavbarOne />

      {/* Hero Breadcrumb */}
      <div
        className="flex items-center gap-4 flex-wrap bg-overlay p-14 sm:p-16 before:bg-title before:bg-opacity-70"
        style={{ backgroundImage: `url(${bg})`, fontFamily: FONT }}
      >
        <div className="text-center w-full">
          <h2 className="text-white md:text-[40px] font-normal leading-none text-center">FAQs</h2>
          <ul className="flex items-center justify-center gap-[10px] text-base md:text-lg leading-none font-normal text-white mt-3 md:mt-4 flex-wrap">
            <li><Link to="/">Home</Link></li>
            <li>/</li>
            <li><GradText>FAQs</GradText></li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="s-py-100" style={{ fontFamily: FONT }}>
        <div className="container-fluid max-w-[1720px] mx-auto">

          {/* Section Header */}
          <div className="max-w-xl mx-auto mb-10 md:mb-14 text-center" data-aos="fade-up" data-aos-delay="100">
            <h3 className="font-medium leading-none text-2xl md:text-3xl">
              Frequently Asked <GradText>Questions</GradText>
            </h3>
            <div style={{ width: 48, height: 3, borderRadius: 2, margin: '10px auto 0', background: BRAND }} />
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Find answers to common questions about our products, orders, payments, and policies.
            </p>
          </div>

          {/* FAQ Grid */}
          <div className="grid lg:grid-cols-2 gap-8 xl:gap-12" data-aos="fade-up" data-aos-delay="150">
            
            {/* Left Column */}
            <div className="space-y-8">
              {/* General Questions */}
              <div className="bg-white dark:bg-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div style={{ width: 32, height: 3, borderRadius: 2, background: BRAND, flexShrink: 0 }} />
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">General Questions</h3>
                </div>
                <FaqOne />
              </div>

              {/* Warranty & Support */}
              <div className="bg-white dark:bg-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div style={{ width: 32, height: 3, borderRadius: 2, background: BRAND, flexShrink: 0 }} />
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">Warranty & Support</h3>
                </div>
                <FaqTwo />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Order & Payment */}
              <div className="bg-white dark:bg-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div style={{ width: 32, height: 3, borderRadius: 2, background: BRAND, flexShrink: 0 }} />
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">Order & Payment</h3>
                </div>
                <FaqThree />
              </div>

              {/* Product Return */}
              <div className="bg-white dark:bg-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div style={{ width: 32, height: 3, borderRadius: 2, background: BRAND, flexShrink: 0 }} />
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">Product Return</h3>
                </div>
                <FaqFour />
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  );
}