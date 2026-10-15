'use client'

// src/components/product-details/ProductActions.tsx
// ══════════════════════════════════════════════════════
//  UPDATED:
//  - onBuyNow callback added → adds to cart then navigates /checkout
//  - isBuyingNow loading state separate from isAdding
//  - Both buttons share maxQty / outOfStock logic
// ══════════════════════════════════════════════════════

import React from 'react';

const BRAND = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';
const PRI   = '#2F4A3A';

interface ProductActionsProps {
  quantity:         number;
  onQuantityChange: (q: number) => void;
  maxQty:           number;
  outOfStock:       boolean;
  isAdding:         boolean;
  isBuyingNow?:     boolean;
  onAddToCart:      () => void;
  onBuyNow?:        () => void;
}

export const ProductActions: React.FC<ProductActionsProps> = ({
  quantity,
  onQuantityChange,
  maxQty,
  outOfStock,
  isAdding,
  isBuyingNow = false,
  onAddToCart,
  onBuyNow,
}) => {
  const disabled = outOfStock || isAdding || isBuyingNow;

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* Quantity selector */}
      <div className="flex items-center gap-4">
        <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
          Qty
        </span>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || disabled}
            className="w-10 h-10 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition"
          >
            −
          </button>
          <span className="w-12 text-center text-[15px] font-extrabold text-gray-900 border-x border-gray-200 py-2 select-none">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(maxQty, quantity + 1))}
            disabled={quantity >= maxQty || disabled}
            className="w-10 h-10 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition"
          >
            +
          </button>
        </div>

        {/* Stock indicator */}
        {!outOfStock && maxQty <= 10 && (
          <span className="text-[12px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
            Only {maxQty} left!
          </span>
        )}
        {outOfStock && (
          <span className="text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
            Out of stock
          </span>
        )}
      </div>

      {/* CTA buttons */}
      <div className="flex gap-3 flex-wrap">
        {/* Add to Cart */}
        <button
          type="button"
          onClick={onAddToCart}
          disabled={disabled}
          className="flex-1 min-w-[140px] h-12 rounded-xl border-2 text-[14px] font-bold transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          style={{ borderColor: PRI, color: PRI, background: 'transparent' }}
        >
          {isAdding ? (
            <>
              <span className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: PRI, borderTopColor: 'transparent' }} />
              Adding…
            </>
          ) : (
            <>🛒 Add to Cart</>
          )}
        </button>

        {/* Buy Now */}
        <button
          type="button"
          onClick={onBuyNow}
          disabled={disabled}
          className="flex-1 min-w-[140px] h-12 rounded-xl text-white text-[14px] font-bold transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          style={{ background: BRAND }}
        >
          {isBuyingNow ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Processing…
            </>
          ) : (
            <>⚡ Buy Now</>
          )}
        </button>
      </div>
    </div>
  );
};