import { useState, useEffect } from 'react';

// ─── useDevice ────────────────────────────────────────────────────────────────
// Use this in every JSX file to know if the user is on mobile or desktop.
//
// Usage:
//   import { useDevice } from './useDevice';
//   const { isMobile } = useDevice();
//
// Then use isMobile to adjust layouts, font sizes, padding etc.
// ─────────────────────────────────────────────────────────────────────────────

export function useDevice() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [isTablet, setIsTablet] = useState(
    typeof window !== 'undefined'
      ? window.innerWidth >= 768 && window.innerWidth < 1024
      : false
  );

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    isMobile,   // phone
    isTablet,   // tablet
    isDesktop: !isMobile && !isTablet, // PC
  };
}
