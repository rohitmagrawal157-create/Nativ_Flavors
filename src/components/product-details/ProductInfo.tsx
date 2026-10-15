'use client'

/**
 * ProductInfo - specs, details, features accordions (all open by default)
 */

import React, { useState } from 'react';
import { LuInfo } from 'react-icons/lu';

interface AccordionItemProps {
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  content,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center w-full text-left hover:text-[#2F4A3A] transition"
      >
        <span className="text-base font-bold text-gray-800">{title}</span>
        <span
          className={`transform transition-transform duration-200 text-xl ${
            open ? 'rotate-45' : 'rotate-0'
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <div className="mt-3 text-sm text-gray-600 leading-relaxed space-y-2">
          {content}
        </div>
      )}
    </div>
  );
};

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const SizeGuideData = [
  { size: 'S', width: '45cm', depth: '50cm', height: '80cm' },
  { size: 'M', width: '50cm', depth: '55cm', height: '85cm' },
  { size: 'L', width: '55cm', depth: '60cm', height: '90cm' },
  { size: 'XL', width: '60cm', depth: '65cm', height: '95cm' },
];

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ open, onClose }) => {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl">Size Guide</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {['Size', 'Width', 'Depth', 'Height'].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-sm border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SizeGuideData.map((row, i) => (
              <tr
                key={row.size}
                className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-3 py-2 border font-bold text-[#2F4A3A]">
                  {row.size}
                </td>
                <td className="px-3 py-2 border">{row.width}</td>
                <td className="px-3 py-2 border">{row.depth}</td>
                <td className="px-3 py-2 border">{row.height}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-xs text-gray-400 mt-3">
          All measurements are approximate. ±2cm tolerance.
        </p>
      </div>
    </div>
  );
};

interface SizeColorSelectorProps {
  sizes: string[];
  colors: string[];
  onSizeGuideClick?: () => void;
}

const SizeColorSelector: React.FC<SizeColorSelectorProps> = ({
  sizes,
  colors,
  onSizeGuideClick,
}) => {
  return (
    <div className="py-5 border-b border-gray-200">
      <div className="flex flex-wrap gap-6 mt-4">
        {/* Sizes */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">Size:</span>
          <div className="flex gap-2">
            {sizes.map((s) => (
              <label key={s} className="cursor-pointer">
                <input
                  type="radio"
                  name="size"
                  defaultChecked={s === 'S'}
                  className="hidden peer"
                />
                <span className="w-8 h-8 flex items-center justify-center text-sm border border-gray-300 rounded-md peer-checked:bg-[#2F4A3A] peer-checked:text-white peer-checked:border-transparent transition">
                  {s}
                </span>
              </label>
            ))}
          </div>
          {onSizeGuideClick && (
            <button
              onClick={onSizeGuideClick}
              className="text-sm text-[#2F4A3A] underline flex items-center gap-1 hover:opacity-80 transition"
            >
              <LuInfo size={14} /> Size Guide
            </button>
          )}
        </div>

        {/* Colors */}
        {colors.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Color:</span>
            <div className="flex gap-2">
              {colors.map((color, idx) => (
                <label key={color} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    defaultChecked={idx === 0}
                    className="hidden peer"
                  />
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200 peer-checked:bg-[#2F4A3A] peer-checked:text-white peer-checked:border-transparent transition">
                    {color}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ProductInfoProps {
  description?: string;
  details?: string;
  features?: string;
  sizes: string[];
  colors: string[];
  category?: string;
  sku?: string;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  description,
  details,
  features,
  sizes,
  colors,
  category,
  sku,
}) => {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const parseDetailPairs = (blob?: string): [string, string][] => {
    const text = String(blob ?? '').trim();
    if (!text) return [];
    const matches = [...text.matchAll(/([A-Za-z ]+):/g)];
    if (matches.length === 0) return [];
    const pairs: [string, string][] = [];
    for (let i = 0; i < matches.length; i++) {
      const key = (matches[i][1] ?? '').trim();
      const start = (matches[i].index ?? 0) + matches[i][0].length;
      const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
      const value = text.slice(start, end).trim();
      if (key) pairs.push([key, value]);
    }
    return pairs;
  };

  const detailPairs = parseDetailPairs(details);
  const featureLines =
    typeof features === 'string'
      ? features
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const infoRows: [string, string][] =
    detailPairs.length > 0
      ? detailPairs
      : [
          ['Size', '20cm D × 40cm L × 8cm H | 1000ml'],
          ['Colour', 'Silver'],
          ['Material', 'Stainless steel, aluminium core'],
        ];

  const shippingRows: [string, string, string][] = [
    ['Prepaid', 'Rs. 50', 'Free'],
    ['Cash on Delivery', 'Rs. 90', 'Rs. 40'],
  ];

  const renderBullets = (items: string[]) => (
    <ul className="list-disc pl-5 space-y-1 text-sm">
      {items.map((f) => (
        <li key={f}>{f}</li>
      ))}
    </ul>
  );

  return (
    <>
      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />

      {/* SKU & Category */}
      <div className="py-5 border-b border-gray-200">
        <div className="flex gap-x-8 gap-y-2 flex-wrap mb-2">
          {sku && (
            <h6 className="text-sm font-medium text-gray-500">SKU: {sku}</h6>
          )}
          {category && (
            <h6 className="text-sm font-medium text-gray-500">Category: {category}</h6>
          )}
        </div>
      </div>

      {/* Size & Color Selector */}
      <SizeColorSelector
        sizes={sizes}
        colors={colors}
        onSizeGuideClick={() => setSizeGuideOpen(true)}
      />

      {/* Product Details Accordions - All open by default */}
      <div className="mt-6">
        <AccordionItem
          title="Description"
          content={
            <p style={{ whiteSpace: 'pre-line' }}>
              {description ||
                'From morning eggs to gourmet stir-fries, this tri-ply hammered stainless steel frying pan is your go-to for effortless cooking.'}
            </p>
          }
          defaultOpen={true}
        />

        <AccordionItem
          title="Features"
          content={
            featureLines.length > 1
              ? renderBullets(featureLines)
              : (
                  <p style={{ whiteSpace: 'pre-line' }}>
                    {String(features)}
                  </p>
                )
          }
          defaultOpen={true}
        />

        <AccordionItem
          title="Size & Detail"
          content={
            <div className="flex flex-col gap-1.5 text-sm">
              {infoRows.map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="font-bold w-16">{k}:</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          }
          defaultOpen={true}
        />

        <AccordionItem
          title="Returns"
          content={
            <p>
              Free 7-day returns. Visit our{' '}
              <a href="/return-policy" className="underline text-[#2F4A3A]">
                Return Policy
              </a>{' '}
              page.
            </p>
          }
          defaultOpen={false}
        />

        <AccordionItem
          title="Care Instructions"
          content={renderBullets([
            'Wash with mild dish soap and a soft sponge.',
            'Do not use steel wool.',
            'Wipe dry after washing.',
          ])}
          defaultOpen={false}
        />

        <AccordionItem
          title="Shipping"
          content={
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2.5 py-2 text-left border">Mode</th>
                  <th className="px-2.5 py-2 text-left border">{`< ₹500`}</th>
                  <th className="px-2.5 py-2 text-left border">{`> ₹500`}</th>
                </tr>
              </thead>
              <tbody>
                {shippingRows.map(([m, lt, gt], i) => (
                  <tr
                    key={m}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-2.5 py-2 border">{m}</td>
                    <td className="px-2.5 py-2 border text-center">{lt}</td>
                    <td
                      className="px-2.5 py-2 border text-center font-bold"
                      style={{
                        color: gt === 'Free' ? '#16a34a' : undefined,
                      }}
                    >
                      {gt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
          defaultOpen={false}
        />
      </div>
    </>
  );
};
