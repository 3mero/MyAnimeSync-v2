'use client';

import { useState, useEffect } from 'react';

/**
 * A hook to check if the component has been hydrated (i.e., mounted on the client).
 * This is useful for avoiding hydration mismatches when rendering client-side only UI.
 *
 * @returns `true` if the component is hydrated, `false` otherwise.
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
