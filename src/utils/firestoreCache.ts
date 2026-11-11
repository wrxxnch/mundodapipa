/**
 * Smart Client-Side & LocalStorage Cache Manager for Firebase Firestore
 * 
 * Dramatically cuts down Firestore read units by:
 * 1. Serving fresh data from memory + localStorage if within TTL (Time-To-Live).
 * 2. Deduplicating concurrent in-flight requests (never fires duplicate parallel reads).
 * 3. Immediately invalidating cache when an admin performs mutations (create/update/delete).
 * 4. Storing metadata timestamps so users and admins can see when data was last synchronized.
 */

interface CacheEnvelope<T> {
  timestamp: number;
  data: T;
}

const memoryStore = new Map<string, CacheEnvelope<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

export const TTL = {
  PRODUCTS: 15 * 60 * 1000,       // 15 minutes
  CATEGORIES: 30 * 60 * 1000,     // 30 minutes
  COUPONS: 20 * 60 * 1000,        // 20 minutes
  POSTS: 20 * 60 * 1000,          // 20 minutes
  REVIEWS: 60 * 60 * 1000,        // 1 hour
  CATALOG_SETTINGS: 30 * 60 * 1000,// 30 minutes
  ABOUT_STORY: 60 * 60 * 1000,    // 1 hour
  ADMIN_USERS: 30 * 60 * 1000,    // 30 minutes
  USER_PROFILE: 30 * 60 * 1000    // 30 minutes
};

const PREFIX = 'mdp_cache_v3_';

/**
 * Retrieve data from cache if it exists and is not expired.
 * Checks fast memory first, then localStorage.
 */
export function cacheGet<T>(key: string, ttlMs: number): T | null {
  const fullKey = PREFIX + key;
  const now = Date.now();

  // 1. Check memory cache
  if (memoryStore.has(fullKey)) {
    const item = memoryStore.get(fullKey)!;
    if (now - item.timestamp < ttlMs) {
      return item.data as T;
    } else {
      memoryStore.delete(fullKey);
    }
  }

  // 2. Check localStorage
  try {
    const raw = localStorage.getItem(fullKey);
    if (raw) {
      const parsed: CacheEnvelope<T> = JSON.parse(raw);
      if (parsed && typeof parsed.timestamp === 'number') {
        if (now - parsed.timestamp < ttlMs) {
          // Re-populate memory cache
          memoryStore.set(fullKey, parsed);
          return parsed.data;
        } else {
          // Expired, keep as stale fallback if needed, but return null for fresh fetch
          return null;
        }
      }
    }
  } catch (err) {
    console.warn(`[FirestoreCache] Error reading ${fullKey}:`, err);
  }

  return null;
}

/**
 * Retrieve stale data from cache if available (for offline/fallback or quota exhausted).
 */
export function cacheGetStale<T>(key: string): T | null {
  const fullKey = PREFIX + key;
  if (memoryStore.has(fullKey)) {
    return memoryStore.get(fullKey)!.data as T;
  }
  try {
    const raw = localStorage.getItem(fullKey);
    if (raw) {
      const parsed: CacheEnvelope<T> = JSON.parse(raw);
      if (parsed && parsed.data !== undefined) {
        return parsed.data;
      }
    }
  } catch {}
  return null;
}

/**
 * Save data to both memory cache and localStorage with a current timestamp.
 */
export function cacheSet<T>(key: string, data: T): void {
  const fullKey = PREFIX + key;
  const envelope: CacheEnvelope<T> = {
    timestamp: Date.now(),
    data
  };

  memoryStore.set(fullKey, envelope);

  try {
    localStorage.setItem(fullKey, JSON.stringify(envelope));
  } catch (err) {
    console.warn(`[FirestoreCache] Error writing ${fullKey}:`, err);
  }
}

/**
 * Invalidate a specific cache key (e.g. after admin update).
 */
export function cacheInvalidate(key: string): void {
  const fullKey = PREFIX + key;
  memoryStore.delete(fullKey);
  try {
    localStorage.removeItem(fullKey);
  } catch {}
}

/**
 * Invalidate all cached Firestore data across the entire application.
 */
export function cacheInvalidateAll(): void {
  memoryStore.clear();
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {}
}

/**
 * Returns the timestamp when the key was last fetched, or null if never.
 */
export function cacheGetTimestamp(key: string): number | null {
  const fullKey = PREFIX + key;
  if (memoryStore.has(fullKey)) {
    return memoryStore.get(fullKey)!.timestamp;
  }
  try {
    const raw = localStorage.getItem(fullKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.timestamp === 'number') {
        return parsed.timestamp;
      }
    }
  } catch {}
  return null;
}

/**
 * In-Flight Promise Deduplicator.
 * Prevents multiple concurrent network requests for the same key.
 */
export async function dedupeRequest<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!;
  }

  const promise = (async () => {
    try {
      return await fetchFn();
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}
