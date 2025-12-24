'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { get, set, del, keys } from '@/lib/idb-keyval';

const CACHE_DB_NAME = 'animesync-image-cache';
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedImage {
  dataUrl: string;
  timestamp: number;
}

interface ImageCacheContextType {
  getImage: (url: string) => Promise<string | null>;
}

const ImageCacheContext = createContext<ImageCacheContextType | undefined>(undefined);

async function imageToDataUrl(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export function ImageCacheProvider({ children }: { children: ReactNode }) {
  const [cacheReady, setCacheReady] = useState(false);

  const cleanupExpiredCache = useCallback(async () => {
    try {
      const allKeys = await keys();
      const now = Date.now();
      for (const key of allKeys) {
        if (typeof key === 'string' && key.startsWith('img-')) {
          const item = await get<CachedImage>(key);
          if (item && (now - item.timestamp > CACHE_EXPIRATION_MS)) {
            await del(key);
          }
        }
      }
    } catch (error) {
      console.error("Failed to cleanup image cache:", error);
    }
  }, []);

  useEffect(() => {
    cleanupExpiredCache().finally(() => setCacheReady(true));
    const interval = setInterval(cleanupExpiredCache, CACHE_EXPIRATION_MS);
    return () => clearInterval(interval);
  }, [cleanupExpiredCache]);
  
  const getImage = useCallback(async (url: string): Promise<string | null> => {
    if (!cacheReady || !url) return null;
    
    const cacheKey = `img-${url}`;

    try {
      const cachedItem = await get<CachedImage>(cacheKey);
      const now = Date.now();

      if (cachedItem && (now - cachedItem.timestamp < CACHE_EXPIRATION_MS)) {
        return cachedItem.dataUrl;
      }
      
      const dataUrl = await imageToDataUrl(url);
      const newItem: CachedImage = { dataUrl, timestamp: now };
      await set(cacheKey, newItem);
      return dataUrl;

    } catch (error) {
      console.warn(`Failed to fetch or cache image ${url}:`, error);
      // Return original URL on failure to allow direct rendering
      return url;
    }
  }, [cacheReady]);

  const value = { getImage };

  return <ImageCacheContext.Provider value={value}>{children}</ImageCacheContext.Provider>;
}

export function useImageCache() {
  const context = useContext(ImageCacheContext);
  if (context === undefined) {
    throw new Error('useImageCache must be used within an ImageCacheProvider');
  }
  return context;
}

// THIS HOOK IS NO LONGER USED in AnimeCard. It remains for potential future use or other components.
export function useCachedImage(url: string) {
    const { getImage } = useImageCache();
    const [cachedSrc, setCachedSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        if (url) {
            setIsLoading(true);
            getImage(url).then(src => {
                if (isMounted) {
                    setCachedSrc(src);
                    setIsLoading(false);
                }
            });
        } else {
            setIsLoading(false);
            setCachedSrc(null);
        }

        return () => { isMounted = false; };
    }, [url, getImage]);

    return { cachedSrc, isLoading };
}
