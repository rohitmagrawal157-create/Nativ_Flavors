'use client'

/**
 * ProductHeader - displays title, rating, stock, price with inline share/wishlist icons
 */

import React, { useState } from 'react';
import {
  FaFacebookF, FaTwitter, FaPinterestP, FaWhatsapp,
} from 'react-icons/fa';
import { LuHeart, LuShare2 } from 'react-icons/lu';
import { StarRating } from './StarRating';
import { formatINR, calculateDiscount } from '../../utils/product.utils';

interface ProductHeaderProps {
  name: string;
  rating: number;
  totalReviews: number;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  stockQty: number;
  isWishlisted?: boolean;
  onWishlistToggle?: () => void;
  onReviewScroll?: () => void;
  isLoadingWishlist?: boolean;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  name,
  rating,
  totalReviews,
  price,
  originalPrice,
  discountPercentage,
  stockQty,
  isWishlisted = false,
  onWishlistToggle,
  onReviewScroll,
  isLoadingWishlist = false,
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);

  const priceINR = formatINR(price);
  const originalINR = originalPrice ? formatINR(originalPrice) : '';
  const discount = discountPercentage ?? calculateDiscount(originalPrice ?? 0, price);

  const shareUrl = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = encodeURIComponent(name);

  const socials = [
    { icon: <FaFacebookF size={14} />, label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, bg: '#1877f2' },
    { icon: <FaTwitter size={14} />, label: 'Twitter', href: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`, bg: '#1da1f2' },
    { icon: <FaPinterestP size={14} />, label: 'Pinterest', href: `https://pinterest.com/pin/create/button/?url=${shareUrl}&description=${shareTitle}`, bg: '#e60023' },
    { icon: <FaWhatsapp size={14} />, label: 'WhatsApp', href: `https://wa.me/?text=${shareTitle}%20${shareUrl}`, bg: '#25d366' },
  ];

  const outOfStock = stockQty === 0;

  return (
    <div className="pb-5 border-b border-gray-200">
      {/* Out of stock badge */}
      {outOfStock && (
        <div className="inline-block text-sm font-bold px-3 py-1 rounded border mb-2 bg-red-50 border-red-200 text-red-600">
          Out of Stock
        </div>
      )}

      {/* Title with inline icons */}
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight flex-1">
          {name}
        </h2>

        <div className="flex items-center gap-2">
          {/* Wishlist button */}
          <button
            onClick={onWishlistToggle}
            disabled={isLoadingWishlist}
            className="p-2 rounded-full hover:bg-gray-100 transition group relative"
            title="Add to wishlist"
          >
            <LuHeart
              size={22}
              style={{
                fill: isWishlisted ? '#E8314A' : 'none',
                stroke: '#E8314A',
              }}
            />
            {isLoadingWishlist && (
              <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-gray-400 animate-spin" />
            )}
          </button>

          {/* Share dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2 rounded-full hover:bg-gray-100 transition"
              title="Share product"
            >
              <LuShare2 size={22} className="text-[#2F4A3A]" />
            </button>

            {showShareMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
                <div className="flex flex-col gap-2">
                  {socials.map(({ icon, label, href, bg }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 transition text-sm font-medium"
                      style={{ color: bg }}
                    >
                      {icon}
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating */}
      <button
        onClick={onReviewScroll}
        className="flex items-center gap-2 mt-2 hover:opacity-80 transition"
      >
        <StarRating rating={rating} size={18} />
        <span className="text-base font-bold text-gray-800">{rating}</span>
        <span className="text-sm text-gray-500 underline">({totalReviews} reviews)</span>
      </button>

      {/* Stock indicator */}
      <div className="mt-3 mb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold" style={{ color: outOfStock ? '#6E736F' : '#2F4A3A' }}>
            {outOfStock ? 'Out of stock' : 'In stock'}
          </span>
        </div>
      </div>

      {/* Price section */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {originalINR && <span className="text-lg line-through text-gray-400">{originalINR}</span>}
        <span
          className="text-3xl md:text-4xl font-extrabold"
          style={{
            background: 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {priceINR}
        </span>
        {discount > 0 && (
          <span className="text-sm font-bold px-2 py-1 rounded bg-red-100 text-red-600 border border-red-200">
            Save {discount}%
          </span>
        )}
      </div>
    </div>
  );
};
