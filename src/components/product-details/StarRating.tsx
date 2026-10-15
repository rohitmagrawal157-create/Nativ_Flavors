'use client'

/**
 * StarRating component - displays star rating
 */

import React from 'react';

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 16,
  color = '#f5a623',
  interactive = false,
  onRatingChange,
}) => {
  return (
    <div className="flex items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const partial = !filled && rating > star - 1;
        const pct = partial ? Math.round((rating - (star - 1)) * 100) : 0;
        const gradId = `sg-${star}-${Math.round(rating * 10)}`;

        return (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            style={{ flexShrink: 0, cursor: interactive ? 'pointer' : 'default' }}
            onClick={() => interactive && onRatingChange?.(star)}
            onMouseEnter={() => interactive && onRatingChange?.(star)}
          >
            {partial && (
              <defs>
                <linearGradient id={gradId}>
                  <stop offset={`${pct}%`} stopColor={color} />
                  <stop offset={`${pct}%`} stopColor="#d1d5db" />
                </linearGradient>
              </defs>
            )}
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={filled ? color : partial ? `url(#${gradId})` : '#e5e7eb'}
            />
          </svg>
        );
      })}
    </div>
  );
};
