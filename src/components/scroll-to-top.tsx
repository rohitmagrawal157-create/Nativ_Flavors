'use client'

// src/components/scroll-to-top.tsx (extended)
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from '@/lib/router'; // 👈 add
import { FiArrowUp } from "react-icons/fi";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);
  const { pathname } = useLocation(); // 👈 get route

  // 👇 Auto-scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // ... rest of your existing code (scroll button logic)
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const nextVisible = window.scrollY > 300;
      if (nextVisible !== isVisibleRef.current) {
        isVisibleRef.current = nextVisible;
        setIsVisible(nextVisible);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isVisible && (
        <button
          onClick={scrollToTop}
          style={{ background: "linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)" }}
          className="text-white hover:opacity-90 p-3 shadow-lg transition duration-300 rounded-full"
          aria-label="Scroll to top"
        >
          <FiArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

export default ScrollToTop;