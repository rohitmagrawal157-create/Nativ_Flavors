'use client'

/**
 * Toast notification component
 */

import React, { useEffect } from 'react';
import { LuCheck, LuInfo, LuX } from 'react-icons/lu';

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <LuCheck className="text-green-600" size={20} />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <LuX className="text-red-600" size={20} />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <LuInfo className="text-blue-600" size={20} />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <LuX className="text-yellow-600" size={20} />,
    },
  };

  const c = config[type];

  return (
    <div
      className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg border ${c.bg} ${c.border} ${c.text} shadow-lg animate-slide-up z-50 max-w-md`}
      role="status"
      aria-live="polite"
    >
      {c.icon}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-black/10 rounded transition"
        aria-label="Close notification"
      >
        <LuX size={16} />
      </button>
    </div>
  );
};

/**
 * Toast container to manage multiple toasts
 */
interface ToastContainerProps {
  toasts: Array<ToastProps & { id: string }>;
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={() => onClose(toast.id)} />
        </div>
      ))}
    </div>
  );
};
