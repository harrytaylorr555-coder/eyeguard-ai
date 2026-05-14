import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

// Helper: returns empty variants object if reduced motion is preferred
export function safeVariants(variants: Record<string, any>, reduced: boolean) {
  if (reduced) {
    const flat: Record<string, any> = {};
    for (const key of Object.keys(variants)) {
      flat[key] = { opacity: 1 };
    }
    return flat;
  }
  return variants;
}
