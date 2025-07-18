
import type { Database } from '@/integrations/supabase/types';

type FAQ = Database['public']['Tables']['faqs']['Row'];

const FAQ_CACHE_KEY = 'ather_faq_cache';
const FAQ_CACHE_VERSION = '1.0.0';
const CACHE_EXPIRY_HOURS = 24;

interface FAQCacheData {
  version: string;
  timestamp: number;
  faqs: FAQ[];
}

class FAQCacheService {
  private isSupported(): boolean {
    try {
      return typeof Storage !== 'undefined' && 'localStorage' in window;
    } catch {
      return false;
    }
  }

  private isExpired(timestamp: number): boolean {
    const now = Date.now();
    const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000; // Convert to milliseconds
    return now - timestamp > expiryTime;
  }

  // Save FAQs to cache
  cacheFAQs(faqs: FAQ[]): void {
    if (!this.isSupported()) {
      console.log('FAQ Cache: LocalStorage not supported');
      return;
    }

    try {
      const cacheData: FAQCacheData = {
        version: FAQ_CACHE_VERSION,
        timestamp: Date.now(),
        faqs: faqs,
      };

      localStorage.setItem(FAQ_CACHE_KEY, JSON.stringify(cacheData));
      console.log(`FAQ Cache: Cached ${faqs.length} FAQs`);
    } catch (error) {
      console.error('FAQ Cache: Failed to save cache:', error);
    }
  }

  // Retrieve FAQs from cache
  getCachedFAQs(): FAQ[] | null {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const cached = localStorage.getItem(FAQ_CACHE_KEY);
      if (!cached) {
        return null;
      }

      const cacheData: FAQCacheData = JSON.parse(cached);

      // Check version compatibility
      if (cacheData.version !== FAQ_CACHE_VERSION) {
        console.log('FAQ Cache: Version mismatch, clearing cache');
        this.clearCache();
        return null;
      }

      // Check if cache is expired
      if (this.isExpired(cacheData.timestamp)) {
        console.log('FAQ Cache: Cache expired, clearing cache');
        this.clearCache();
        return null;
      }

      console.log(`FAQ Cache: Retrieved ${cacheData.faqs.length} cached FAQs`);
      return cacheData.faqs;
    } catch (error) {
      console.error('FAQ Cache: Failed to retrieve cache:', error);
      this.clearCache();
      return null;
    }
  }

  // Check if FAQs are cached and valid
  isCached(): boolean {
    const cached = this.getCachedFAQs();
    return cached !== null && cached.length > 0;
  }

  // Clear FAQ cache
  clearCache(): void {
    if (!this.isSupported()) {
      return;
    }

    try {
      localStorage.removeItem(FAQ_CACHE_KEY);
      console.log('FAQ Cache: Cache cleared');
    } catch (error) {
      console.error('FAQ Cache: Failed to clear cache:', error);
    }
  }

  // Get cache info for debugging
  getCacheInfo(): { isCached: boolean; count: number; age: number } | null {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const cached = localStorage.getItem(FAQ_CACHE_KEY);
      if (!cached) {
        return { isCached: false, count: 0, age: 0 };
      }

      const cacheData: FAQCacheData = JSON.parse(cached);
      const ageHours = (Date.now() - cacheData.timestamp) / (1000 * 60 * 60);

      return {
        isCached: true,
        count: cacheData.faqs.length,
        age: Math.round(ageHours * 100) / 100, // Round to 2 decimal places
      };
    } catch (error) {
      console.error('FAQ Cache: Failed to get cache info:', error);
      return null;
    }
  }

  // Preload FAQs for offline access
  async preloadFAQs(): Promise<void> {
    // This would be called during app initialization or when online
    console.log('FAQ Cache: Preloading FAQs for offline access...');
    
    // Note: This is a placeholder - the actual preloading would be handled
    // by the React Query cache and our FAQ hooks
  }
}

// Export singleton instance
export const faqCacheService = new FAQCacheService();

// Utility function to enhance React Query with caching
export const withFAQCache = <T extends FAQ[]>(
  queryFn: () => Promise<T>
): (() => Promise<T>) => {
  return async () => {
    try {
      // Try to fetch fresh data
      const freshData = await queryFn();
      
      // Cache the fresh data
      if (freshData && freshData.length > 0) {
        faqCacheService.cacheFAQs(freshData);
      }
      
      return freshData;
    } catch (error) {
      // If fetch fails, try to return cached data
      console.log('FAQ Cache: Network error, attempting to use cached data');
      const cachedData = faqCacheService.getCachedFAQs();
      
      if (cachedData && cachedData.length > 0) {
        console.log('FAQ Cache: Using cached data as fallback');
        return cachedData as T;
      }
      
      // If no cached data available, re-throw the error
      throw error;
    }
  };
};
