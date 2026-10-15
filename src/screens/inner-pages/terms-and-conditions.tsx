'use client'

// src/screens/inner-pages/TermsAndConditions.tsx
import { Link } from '@/lib/router';
import { useEffect } from "react";

import NavbarOne from "../../components/navbar/navbar-one";
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

export default function TermsAndConditions() {
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
          <h2 className="text-white md:text-[40px] font-normal leading-none text-center">Terms &amp; Conditions</h2>
          <ul className="flex items-center justify-center gap-[10px] text-base md:text-lg leading-none font-normal text-white mt-3 md:mt-4 flex-wrap">
            <li><Link to="/">Home</Link></li>
            <li>/</li>
            <li><GradText>Terms &amp; Conditions</GradText></li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="s-py-100" style={{ fontFamily: FONT }}>
        <div className="container" data-aos="fade-up" data-aos-delay="100">
          <div className="max-w-[940px] mx-auto">
            <div className="bg-white dark:bg-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-10 shadow-sm hover:shadow-md transition-shadow duration-300">
              <article className="prose max-w-none prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-headings:text-gray-900 dark:prose-headings:text-white prose-h3:!text-2xl md:prose-h3:!text-3xl prose-h4:!text-xl md:prose-h4:!text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-h4:mt-6 prose-h4:mb-3 prose-p:mb-4 prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-li:mb-1">

                <h3>For Shipping</h3>
                <p>We strive to ensure timely delivery of your orders. Shipping times may vary based on your location and the selected delivery option. Please review our shipping policies for details on processing times, charges, and tracking updates. Contact us for any shipping-related inquiries or assistance.</p>

                <h3>For Return</h3>
                <p>We offer a hassle-free process to ensure your satisfaction. Please review our return policy for eligibility and steps to initiate a return. we offer a hassle-free process to ensure your satisfaction. Please review our return policy for eligibility and steps to initiate a return.</p>

                <h3>Payment</h3>
                <p>We offer secure and flexible options to suit your needs. Choose from multiple methods, including credit cards, debit cards, and online payment gateways. All transactions are encrypted to ensure your information remains safe. For any payment-related concerns, our support team is here to assist.</p>

                <h3>Warranty &amp; Support Services</h3>
                <p>We provide comprehensive warranty and support services to ensure your satisfaction and peace of mind. Our warranty covers eligible products against defects, ensuring quality and reliability. Additionally, our dedicated support team is available to assist you with any inquiries or technical issues. Whether you need guidance or a solution, we are here to help every step of the way.</p>
                <ul>
                  <li>All the Lorem Ipsum generators on the Internet tend to repeat predefined on the Internet.</li>
                  <li>Nibh purus integer elementum in tellus vulputate habitasse</li>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
                  <li>Generators on the Internet tend to repeat predefined good quality furniture.</li>
                </ul>

                <h3>Order cancellation</h3>
                <p>Our warranty covers eligible products against defects, ensuring quality and reliability. Additionally, our dedicated support team is available to assist you with any inquiries or technical issues. Whether you need guidance or a solution, we are here to help every step of the way.</p>
                <ol>
                  <li>Nibh purus integer elementum in tellus vulputate habitasse</li>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
                  <li>Generators on the Internet tend to repeat predefined good quality furniture.</li>
                </ol>
              </article>
            </div>
          </div>
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  );
}