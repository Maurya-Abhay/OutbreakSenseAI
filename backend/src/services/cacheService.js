const cacheStore = new Map();

const now = () => Date.now();

const cleanupIfNeeded = () => {
  const current = now();

  for (const [key, entry] of cacheStore.entries()) {
    if (!entry || entry.expiresAt <= current) {
      cacheStore.delete(key);
    }
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

  if (cacheStore.size > 250) {
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
