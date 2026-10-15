'use client'

// src/screens/inner-pages/ReturnPolicy.tsx
import { useEffect } from "react";
import { Link } from '@/lib/router';
import Aos from "aos";

import NavbarOne from "../../components/navbar/navbar-one";
import FooterOne from "../../components/footer/footer-one";
import ScrollToTop from "../../components/scroll-to-top";
import bg from "../../assets/img/shortcode/breadcumb.jpg";

import { LuShieldCheck, LuRefreshCcw, LuTruck, LuClock, LuFileText, LuShoppingBag } from "react-icons/lu";

// ── Brand tokens ──────────────────────────────────────────────────────────────
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

export default function ReturnPolicy() {
  useEffect(() => {
    Aos.init({ once: true, duration: 600 });
  }, []);

  return (
    <>
      <NavbarOne />

      {/* Breadcrumb Hero */}
      <div
        className="flex items-center gap-4 flex-wrap bg-overlay p-14 sm:p-16 before:bg-title before:bg-opacity-70"
        style={{ backgroundImage: `url(${bg})`, fontFamily: FONT }}
      >
        <div className="text-center w-full">
          <h2 className="text-white md:text-[40px] font-normal leading-none text-center">Return Policy</h2>
          <ul className="flex items-center justify-center gap-[10px] text-base md:text-lg leading-none font-normal text-white mt-3 md:mt-4 flex-wrap">
            <li><Link to="/">Home</Link></li>
            <li>/</li>
            <li><GradText>Return Policy</GradText></li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="s-py-100" style={{ fontFamily: FONT }}>
        <div className="container-fluid">
          <div className="max-w-[1200px] mx-auto">

            {/* Section Header */}
            <div className="max-w-xl mx-auto mb-10 md:mb-14 text-center" data-aos="fade-up" data-aos-delay="100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <LuRefreshCcw size={32} />
              </div>
              <h3 className="font-medium leading-none text-2xl md:text-3xl">
                Return &amp; Refund <GradText>Policy</GradText>
              </h3>
              <div style={{ width: 48, height: 3, borderRadius: 2, margin: '10px auto 0', background: BRAND }} />
              <p className="mt-4 text-gray-500 dark:text-gray-400">Last updated: April 2025</p>
            </div>

            {/* Policy Card */}
            <div
              className="bg-white dark:bg-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 sm:p-8 md:p-10"
              data-aos="fade-up"
              data-aos-delay="150"
            >
              <div className="prose prose-lg max-w-none dark:prose-invert prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-headings:text-gray-900 dark:prose-headings:text-white prose-strong:text-primary dark:prose-strong:text-primary prose-a:text-primary prose-a:no-underline hover:prose-a:underline">

                <p className="text-base leading-relaxed">
                  At <strong>Infinity</strong>, we take pride in the quality of our products. However, if you are not completely satisfied with your purchase, we are here to help. Please read our return and refund policy carefully.
                </p>

                <hr className="my-6 border-gray-200 dark:border-gray-700" />

                {/* 1. Returns */}
                <div data-aos="fade-up" data-aos-delay="100">
                  <div className="flex items-center gap-3 mb-3">
                    <LuTruck className="text-primary" size={22} />
                    <h2 className="text-xl font-semibold text-title dark:text-white">1. Return Window</h2>
                  </div>
                  <p className="text-base leading-relaxed mb-4">
                    You have <strong className="text-primary">7 days</strong> from the date of delivery to request a return. After 7 days, we cannot offer a refund or exchange.
                  </p>
                </div>

                {/* 2. Eligibility */}
                <div data-aos="fade-up" data-aos-delay="150">
                  <div className="flex items-center gap-3 mb-3">
                    <LuShieldCheck className="text-primary" size={22} />
                    <h2 className="text-xl font-semibold text-title dark:text-white">2. Eligibility Conditions</h2>
                  </div>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Item must be unused, unwashed, and in the same condition that you received it.</li>
                    <li>Item must be in the original packaging with all tags attached.</li>
                    <li>Proof of purchase (order number or invoice) is required.</li>
                    <li>Customized/personalized items (e.g., custom blinds, neon signs, wall murals with uploaded images) are <strong>non-returnable</strong> unless they arrive damaged or defective.</li>
                    <li>Sale items are final sale and cannot be returned unless defective.</li>
                  </ul>
                </div>

                {/* 3. Non-returnable items */}
                <div data-aos="fade-up" data-aos-delay="200">
                  <div className="flex items-center gap-3 mb-3">
                    <LuShoppingBag className="text-primary" size={22} />
                    <h2 className="text-xl font-semibold text-title dark:text-white">3. Non-Returnable Items</h2>
                  </div>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Custom or personalized orders (including custom blinds, custom neon signs, custom wall murals).</li>
                    <li>Gift cards.</li>
                    <li>Downloadable software or digital products.</li>
                    <li>Items marked as “Final Sale”.</li>
                  </ul>
                </div>

                {/* 4. Return Process */}
                <div data-aos="fade-up" data-aos-delay="250">
                  <div className="flex items-center gap-3 mb-3">
                    <LuFileText className="text-primary" size={22} />
                    <h2 className="text-xl font-semibold text-title dark:text-white">4. How to Initiate a Return</h2>
                  </div>
                  <ol className="list-decimal pl-6 space-y-2 mb-4">
                    <li>Contact our support team at <a href="mailto:returns@infinity.com" className="text-primary hover:underline">returns@infinity.com</a> with your order number and reason for return.</li>
                    <li>We will provide you with a Return Authorization (RA) number and shipping instructions.</li>
                    <li>Pack the item securely in its original packaging and include the RA number.</li>
                    <li>Ship the item to the address provided. Return shipping costs are the responsibility of the customer unless the item is defective or we made an error.</li>
                  </ol>
                </div>

                {/* 5. Refunds */}
                <div data-aos="fade-up" data-aos-delay="300">
                  <div className="flex items-center gap-3 mb-3">
                    <LuClock className="text-primary" size={22} />
                    <h2 className="text-xl font-semibold text-title dark:text-white">5. Refund Timeline</h2>
                  </div>
                  <p className="text-base leading-relaxed mb-2">
                    Once we receive and inspect your return, we will notify you of the approval or rejection. Approved refunds will be processed within <strong>5–7 business days</strong> to your original payment method.
                  </p>
                  <p className="text-base leading-relaxed">
                    Depending on your bank or credit card issuer, it may take an additional 2–10 business days for the credit to appear in your account.
                  </p>
                </div>

                {/* 6. Damaged or Defective Items */}
                <div data-aos="fade-up" data-aos-delay="350">
                  <h2 className="text-xl font-semibold text-title dark:text-white mb-3">6. Damaged or Defective Items</h2>
                  <p className="text-base leading-relaxed mb-2">
                    If your product arrives damaged or defective, please contact us within <strong>48 hours</strong> of delivery. Provide your order number and clear photos of the damage. We will arrange a replacement or full refund at no extra cost, including return shipping.
                  </p>
                </div>

                {/* 7. Exchanges */}
                <div data-aos="fade-up" data-aos-delay="400">
                  <h2 className="text-xl font-semibold text-title dark:text-white mb-3">7. Exchanges</h2>
                  <p className="text-base leading-relaxed">
                    We only replace items if they are defective or damaged. If you need a different size or colour, please return the original item (subject to eligibility) and place a new order.
                  </p>
                </div>

                {/* 8. Contact Us */}
                <div data-aos="fade-up" data-aos-delay="450">
                  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mt-8">
                    <h2 className="text-xl font-semibold text-title dark:text-white mb-3">Need Help?</h2>
                    <p className="text-base leading-relaxed">
                      If you have any questions about our return policy, please contact our support team:
                    </p>
                    <ul className="mt-3 space-y-1">
                      <li>📧 Email: <a href="mailto:support@infinity.com" className="text-primary hover:underline">support@infinity.com</a></li>
                      <li>📞 Phone: <a href="tel:+919903504754" className="text-primary hover:underline">+91 99035 04754</a></li>
                      <li>💬 WhatsApp: <a href="https://wa.me/919903504754" className="text-primary hover:underline">Click to chat</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional note about custom products */}
            <div
              className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
              data-aos="fade-up"
              data-aos-delay="500"
            >
              <p>
                <strong>Note:</strong> Custom-made products (blinds, neon signs, wall murals) are non-returnable unless faulty.
                Please double-check your measurements and design before placing the order.
              </p>
            </div>
          </div>
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  );
}