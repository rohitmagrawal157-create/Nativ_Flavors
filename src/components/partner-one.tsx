'use client'

import { Link } from '@/lib/router';
import TinySlider from "tiny-slider-react";
import 'tiny-slider/dist/tiny-slider.css';
import { partnerData } from '../data/data'; // adjust path

interface PartnerData {
  image: string;
  image2: string;
  name?: string; // optional
}

const settings = {
  container: '.tiny-three-item',
  controls: false,
  mouseDrag: true,
  loop: true,
  rewind: true,
  autoplay: true,
  autoplayButtonOutput: false,
  autoplayTimeout: 3000,
  navPosition: "bottom",
  speed: 400,
  gutter: 24,         // increased gap between logos
  responsive: {
    1280: { items: 6 },   // ultra wide
    1024: { items: 5 },
    768:  { items: 4 },
    640:  { items: 3 },
    320:  { items: 2 },
  },
};

export default function PartnerOne() {
  return (
    <>
      {/* Light mode */}
      <div className="block dark:hidden">
        <div className="max-w-[1720px] mx-auto home-v1-partner-slider partner">
          <TinySlider settings={settings}>
            {partnerData.map((item: PartnerData, index: number) => (
              <Link
                to="#"
                key={index}
                className="flex items-center justify-center w-full px-4"
              >
                <img
                  src={item.image}
                  alt={item.name || `Partner ${index + 1}`}
                  className="mx-auto max-h-12 md:max-h-16 w-auto object-contain"
                />
              </Link>
            ))}
          </TinySlider>
        </div>
      </div>

      {/* Dark mode (same images – replace with dark‑optimised if available) */}
      <div className="hidden dark:block">
        <div className="max-w-[1720px] mx-auto home-v1-partner-slider partner">
          <TinySlider settings={settings}>
            {partnerData.map((item: PartnerData, index: number) => (
              <Link
                to="#"
                key={index}
                className="flex items-center justify-center w-full px-4"
              >
                <img
                  src={item.image2}
                  alt={item.name || `Partner ${index + 1}`}
                  className="mx-auto max-h-12 md:max-h-16 w-auto object-contain brightness-0 invert"
                />
              </Link>
            ))}
          </TinySlider>
        </div>
      </div>
    </>
  );
}