'use client'

/**
 * ProductActions - cart, quantity, wishlist, delivery info
 */

import React, { useState } from 'react';
import { LuTruck, LuShieldCheck, LuRefreshCcw, LuPackage, LuMapPin, LuClock } from 'react-icons/lu';
import type { DeliveryFeature } from '../../types/product';
import { getDeliveryDateRange } from '../../utils/product.utils';

interface QuantitySelectorProps {
  quantity: number;
  maxQty: number;
  onQuantityChange: (qty: number) => void;
  disabled?: boolean;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  maxQty,
  onQuantityChange,
  disabled = false,
}) => {
  const [error, setError] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      onQuantityChange(1);
      return;
    }
    if (val > maxQty) {
      setError(true);
      onQuantityChange(maxQty);
      return;
    }
    setError(false);
    onQuantityChange(val);
  };

  return (
    <div className="relative inline-flex mb-4">
      {error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 rounded text-xs font-bold text-white bg-red-600">
          Only {maxQty} left!
        </div>
      )}
      <button
        onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
        disabled={disabled || quantity <= 1}
        className="w-10 h-10 border border-gray-300 bg-white hover:bg-[#2F4A3A] hover:text-white transition text-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        max={maxQty}
        value={quantity}
        onChange={handleChange}
        disabled={disabled}
        className="w-14 h-10 border-t border-b border-gray-300 text-center font-bold text-base outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        onClick={() => onQuantityChange(Math.min(maxQty, quantity + 1))}
        disabled={disabled || quantity >= maxQty}
        className="w-10 h-10 border border-gray-300 bg-white hover:bg-[#2F4A3A] hover:text-white transition text-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  );
};

interface DeliveryInfoProps {
  onPincodeCheck?: (pincode: string, isValid: boolean) => void;
}

const DeliveryInfo: React.FC<DeliveryInfoProps> = ({ onPincodeCheck }) => {
  const [pincode, setPincode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleCheck = () => {
    if (pincode.length !== 6) {
      setMessage('Enter a valid 6-digit pincode.');
      onPincodeCheck?.(pincode, false);
      return;
    }

    setChecking(true);
    setTimeout(() => {
      const isValid = parseInt(pincode[0], 10) > 2;
      const deliveryRange = getDeliveryDateRange();
      const msg = isValid
        ? `✓ Delivery available by ${deliveryRange}`
        : '✗ Delivery not available at this pincode.';

      setMessage(msg);
      onPincodeCheck?.(pincode, isValid);
      setChecking(false);
    }, 800);
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4 mb-4 bg-gray-50">
      <div className="flex items-start gap-3 mb-3">
        <LuClock size={18} className="mt-0.5 text-[#2F4A3A]" />
        <div>
          <span className="text-sm font-bold text-gray-700">Estimated Delivery: </span>
          <span className="text-sm font-semibold text-[#2F4A3A]">{getDeliveryDateRange()}</span>
          <p className="text-xs text-gray-400 mt-0.5">For orders placed before 2 PM today</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LuMapPin size={16} className="text-gray-400" />
        <input
          type="text"
          maxLength={6}
          placeholder="Enter pincode"
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, ''));
            setMessage(null);
          }}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2F4A3A]"
        />
        <button
          onClick={handleCheck}
          disabled={checking}
          className="text-sm font-bold px-4 py-2 rounded-lg transition-all text-white disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)',
          }}
        >
          {checking ? '...' : 'Check'}
        </button>
      </div>

      {message && (
        <p
          className={`text-sm mt-2 font-medium ${
            message.includes('✓') ? 'text-green-600' : 'text-red-500'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

const DeliveryFeatureStrip: React.FC = () => {
  const features: DeliveryFeature[] = [
    { icon: <LuTruck size={18} />, label: 'Free Shipping', sub: 'On orders above ₹999' },
    { icon: <LuRefreshCcw size={18} />, label: '7-Day Returns', sub: 'Hassle-free returns' },
    { icon: <LuShieldCheck size={18} />, label: 'Secure Payments', sub: '100% safe & encrypted' },
    { icon: <LuPackage size={18} />, label: 'Cash on Delivery', sub: 'Available on all orders' },
  ];

  return (
    <div className="grid grid-cols-2 gap-px rounded-xl overflow-hidden mb-4 border border-gray-200">
      {features.map(({ icon, label, sub }) => (
        <div key={label} className="flex items-center gap-3 bg-white px-4 py-3">
          <span className="text-[#2F4A3A] flex-shrink-0">{icon}</span>
          <div>
            <div className="text-sm font-bold text-gray-800">{label}</div>
            <div className="text-xs text-gray-400">{sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface AddToCartButtonsProps {
  isAdding: boolean;
  outOfStock: boolean;
  onAddToCart: () => void;
  onBuyNow?: () => void;
}

const AddToCartButtons: React.FC<AddToCartButtonsProps> = ({
  isAdding,
  outOfStock,
  onAddToCart,
  onBuyNow,
}) => {
  return (
    <div className="flex gap-3 mb-4">
      <button
        onClick={!outOfStock && !isAdding ? onAddToCart : undefined}
        disabled={isAdding || outOfStock}
        className="flex-1 h-12 text-base font-semibold rounded-xl transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: outOfStock
            ? '#d1d5db'
            : isAdding
              ? '#786b4a'
              : 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)',
        }}
      >
        {outOfStock ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
      </button>

      <button
        onClick={onBuyNow}
        disabled={outOfStock}
        className="flex-1 h-12 text-base font-semibold rounded-xl transition-all border-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: outOfStock ? '#f3f4f6' : '#fff',
          color: outOfStock ? '#9ca3af' : '#2F4A3A',
          borderColor: outOfStock ? '#d1d5db' : '#2F4A3A',
        }}
        onMouseEnter={(e) => {
          if (!outOfStock) {
            e.currentTarget.style.background = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}
        onMouseLeave={(e) => {
          if (!outOfStock) {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#2F4A3A';
            e.currentTarget.style.borderColor = '#2F4A3A';
          }
        }}
      >
        Buy Now
      </button>
    </div>
  );
};

interface OutOfStockPanelProps {
  onNotify?: (email: string) => void;
}

const OutOfStockPanel: React.FC<OutOfStockPanelProps> = ({ onNotify }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    onNotify?.(email);
    setSubmitted(true);
  };

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-4">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-xl">😔</span>
        <div>
          <div className="text-base font-bold text-red-700">Currently Out of Stock</div>
          <div className="text-sm text-gray-500">We're restocking soon — get notified!</div>
        </div>
      </div>

      {submitted ? (
        <div className="text-sm font-bold text-green-600">
          ✓ You're on the list! We'll email you when it's back.
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2F4A3A]"
            />
            <button
              onClick={handleSubmit}
              className="text-white text-sm font-bold px-4 py-2 rounded-lg transition-all"
              style={{
                background: 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)',
              }}
            >
              Notify Me
            </button>
          </div>
          {error && <p className="text-sm text-red-500 mt-1.5">{error}</p>}
        </div>
      )}
    </div>
  );
};

interface ProductActionsProps {
  quantity: number;
  onQuantityChange: (qty: number) => void;
  maxQty: number;
  outOfStock: boolean;
  isAdding: boolean;
  onAddToCart: () => void;
  cartError?: string | null;
   isBuyingNow: boolean;  
  
}

export const ProductActions: React.FC<ProductActionsProps> = ({
  quantity,
  onQuantityChange,
  maxQty,
  outOfStock,
  isAdding,
  onAddToCart,
  //  isBuyingNow,  // ← ADD THIS
  cartError,
}) => {
  return (
    <>
      <div className="py-4">
        <DeliveryFeatureStrip />
      </div>

      <DeliveryInfo />

      <div className="pb-5 border-b border-gray-200">
        {outOfStock ? (
          <OutOfStockPanel />
        ) : (
          <div className="flex items-center gap-4 flex-wrap mb-4">
            <QuantitySelector
              quantity={quantity}
              maxQty={maxQty}
              onQuantityChange={onQuantityChange}
              disabled={false}
            />
          </div>
        )}

        <AddToCartButtons
          isAdding={isAdding}
          outOfStock={outOfStock}
          onAddToCart={onAddToCart}
        />

        {cartError && <p className="text-sm text-red-600 mt-2">{cartError}</p>}
      </div>
    </>
  );
};
