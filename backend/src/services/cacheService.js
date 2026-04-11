const cacheStore = new Map();
const MAX_CACHE_SIZE = 100; // Hard cap to prevent memory leak
const CLEANUP_INTERVAL = 60_000; // Clean expired entries every 60s

const now = () => Date.now();

// Periodic cleanup to remove expired entries
setInterval(() => {
  const current = now();
  let removed = 0;
  
  for (const [key, entry] of cacheStore.entries()) {
    if (!entry || entry.expiresAt <= current) {
      cacheStore.delete(key);
      removed++;
    }
  }
  
  if (removed > 0) {
    console.log(`[Cache] Cleaned up ${removed} expired entries. Current size: ${cacheStore.size}`);
  }
}, CLEANUP_INTERVAL);

const cleanupIfNeeded = () => {
  const current = now();

  for (const [key, entry] of cacheStore.entries()) {
    if (!entry || entry.expiresAt <= current) {
      cacheStore.delete(key);
    }
  }
  
  // If still over limit, remove oldest entries (LRU-style)
  if (cacheStore.size > MAX_CACHE_SIZE) {
    const entriesToDelete = cacheStore.size - Math.floor(MAX_CACHE_SIZE * 0.75); // Keep 75% of max
    let deleted = 0;
    
    for (const [key] of cacheStore.entries()) {
      if (deleted >= entriesToDelete) break;
      cacheStore.delete(key);
      deleted++;
    }
    
    console.warn(`[Cache] Enforced hard cap: deleted ${deleted} old entries. Size now: ${cacheStore.size}`);
  }
};

export const buildCacheKey = (prefix, payload = {}) => {
  const serialized = JSON.stringify(payload, Object.keys(payload).sort());
  return `${prefix}:${serialized}`;
};

export const getCacheValue = (key) => {
  const entry = cacheStore.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= now()) {
    cacheStore.delete(key);
    return null;
  }

  return entry.value;
};

export const setCacheValue = (key, value, ttlMs = 30_000) => {
  cacheStore.set(key, {
    value,
    expiresAt: now() + Math.max(1_000, ttlMs)
  });

  // Check if cleanup is needed (every insertion keeps it efficient)
  if (cacheStore.size > MAX_CACHE_SIZE * 0.8) {
    cleanupIfNeeded();
  }
};

export const invalidateCacheByPrefix = (prefix) => {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(`${prefix}:`)) {
      cacheStore.delete(key);
    }
  }
};

/**
 * Location-specific risk prediction cache
 * TTL: 5 minutes (30_000ms = 30 seconds for testing, use 300_000ms in production)
 * Prevents redundant AI predictions for same location
 */
export const getCachedLocationPrediction = (locationName) => {
  const key = `location-prediction:${locationName}`;
  return getCacheValue(key);
};

export const setCachedLocationPrediction = (locationName, predictionResult, ttlMs = 300_000) => {
  const key = `location-prediction:${locationName}`;
  setCacheValue(key, predictionResult, ttlMs);
  console.log(`[Cache] Cached prediction for ${locationName} (TTL: ${ttlMs}ms)`);
};

export const invalidateLocationPrediction = (locationName) => {
  const key = `location-prediction:${locationName}`;
  cacheStore.delete(key);
  console.log(`[Cache] Invalidated prediction for ${locationName}`);
};

