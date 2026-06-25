/**
 * data-cache.js — TTL + inflight-dedupe cache (generalizes participants-cache.js).
 *
 * scope: 'memory' (default) | 'persistent' (localStorage, shared non-sensitive data only)
 * staleWhileRevalidate: return stale immediately and refresh in background
 */

const LS_PREFIX = 'z2d_cache:';
const memory = new Map();   // key -> { data, at, ttlMs }
const inflight = new Map(); // key -> Promise

function hasLocalStorage() {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function readPersistent(key) {
  if (!hasLocalStorage()) return null;
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.at !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePersistent(key, entry) {
  if (!hasLocalStorage()) return;
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry));
  } catch { /* quota / private mode */ }
}

function removePersistent(keyOrPrefix, exact) {
  if (!hasLocalStorage()) return;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(LS_PREFIX)) continue;
    const bare = k.slice(LS_PREFIX.length);
    if (exact ? bare === keyOrPrefix : (bare === keyOrPrefix || bare.startsWith(keyOrPrefix))) {
      localStorage.removeItem(k);
    }
  }
}

function isFresh(entry, ttlMs, now = Date.now()) {
  return entry && (now - entry.at) < (entry.ttlMs ?? ttlMs);
}

function store(key, data, ttlMs, scope) {
  const entry = { data, at: Date.now(), ttlMs };
  memory.set(key, entry);
  if (scope === 'persistent') writePersistent(key, entry);
  return data;
}

function startFetch(key, fetcher, ttlMs, scope) {
  const p = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      store(key, data, ttlMs, scope);
      inflight.delete(key);
      return data;
    })
    .catch((e) => {
      inflight.delete(key);
      throw e;
    });
  inflight.set(key, p);
  return p;
}

/**
 * @param {string} key — caller-supplied, school/user-scoped
 * @param {() => Promise<any>} fetcher
 * @param {{ ttlMs?: number, scope?: 'memory'|'persistent', staleWhileRevalidate?: boolean }} [opts]
 */
export async function cached(key, fetcher, {
  ttlMs = 5 * 60_000,
  scope = 'memory',
  staleWhileRevalidate = true,
} = {}) {
  const now = Date.now();
  const mem = memory.get(key);
  if (mem && isFresh(mem, ttlMs, now)) return mem.data;

  let stale = null;
  if (mem && staleWhileRevalidate) stale = mem.data;

  if (scope === 'persistent') {
    const pe = readPersistent(key);
    if (pe && isFresh(pe, ttlMs, now)) {
      memory.set(key, pe);
      return pe.data;
    }
    if (pe && staleWhileRevalidate && stale == null) stale = pe.data;
  }

  if (inflight.has(key)) return inflight.get(key);

  if (stale != null && staleWhileRevalidate) {
    startFetch(key, fetcher, ttlMs, scope);
    return stale;
  }

  return startFetch(key, fetcher, ttlMs, scope);
}

/** Exact key or prefix sweep (e.g. `school:abc:subjects`). */
export function invalidate(keyOrPrefix) {
  if (!keyOrPrefix) {
    memory.clear();
    inflight.clear();
    if (hasLocalStorage()) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith(LS_PREFIX)) localStorage.removeItem(k);
      }
    }
    return;
  }
  for (const k of [...memory.keys()]) {
    if (k === keyOrPrefix || k.startsWith(keyOrPrefix)) memory.delete(k);
  }
  for (const k of [...inflight.keys()]) {
    if (k === keyOrPrefix || k.startsWith(keyOrPrefix)) inflight.delete(k);
  }
  removePersistent(keyOrPrefix, false);
}

/** Clear in-memory entries only (call on logout to prevent cross-user private leaks). */
export function clearMemoryCache() {
  memory.clear();
  inflight.clear();
}

/** FNV-1a hash for cache keys (matches functions/lib/cache.js). */
export function hashKey(parts) {
  const str = Array.isArray(parts) ? parts.join('|') : String(parts);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
