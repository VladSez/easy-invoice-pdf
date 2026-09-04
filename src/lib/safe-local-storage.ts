"use client";

/**
 * Resolves `localStorage`, or `null` when it cannot be used.
 *
 * `localStorage` is not guaranteed to exist, even in a real browser:
 * - iOS in-app webviews (Telegram, Instagram, Facebook) expose it as `null`, so an
 *   unguarded read throws
 *   `TypeError: null is not an object (evaluating 'localStorage.getItem')`.
 * - Safari with "Block all cookies" throws a `SecurityError` on the property access.
 * - It does not exist while a client component is server-rendered.
 *
 * Resolved on every call rather than once at module scope: a module-scope probe runs
 * during SSR, where storage is always unavailable, and would bake that answer into the
 * first client render.
 */
function getLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    const storage: Storage | null = window.localStorage;

    return storage;
  } catch {
    return null;
  }
}

/**
 * Reads a key from `localStorage`. Never throws.
 *
 * @returns the stored string, or `null` when storage is unavailable or the key is unset.
 */
export function safeLocalStorageGetItem(key: string): string | null {
  const storage = getLocalStorage();

  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

interface SafeLocalStorageSetItemOptions {
  /** The `localStorage` key to write to. */
  key: string;
  /** The value to persist. */
  value: string;
}

/**
 * Writes a key to `localStorage`. Never throws.
 *
 * @returns `true` when the value was persisted, `false` when storage was unavailable or
 * the write was rejected (private mode, quota exceeded).
 */
export function safeLocalStorageSetItem({
  key,
  value,
}: SafeLocalStorageSetItemOptions): boolean {
  const storage = getLocalStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, value);

    return true;
  } catch {
    return false;
  }
}

/**
 * Cached answer of the availability probe, so the write/remove round trip only runs once
 * per page load. Never populated on the server: `null` there means "not probed yet"
 * rather than "unavailable", so the client is free to probe for real after hydration.
 */
let cachedAvailability: boolean | null = null;

/**
 * Whether `localStorage` can actually be written to, probed with a write/remove round
 * trip — the read-only checks above cannot tell a working store from one that accepts
 * `getItem` but rejects every write (Safari private mode used to do exactly that).
 *
 * Always `false` on the server. Prefer `useIsLocalStorageAvailable` when the answer
 * decides what to render, so the server and the hydrating client agree.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#testing_for_availability
 */
export function isLocalStorageAvailable(): boolean {
  if (cachedAvailability !== null) {
    return cachedAvailability;
  }

  const storage = getLocalStorage();

  if (!storage) {
    return false;
  }

  const probeKey = "__storage_test__";

  let available: boolean;

  try {
    storage.setItem(probeKey, probeKey);
    storage.removeItem(probeKey);

    available = true;
  } catch (error) {
    // A full store still counts as available, as long as something is already in it —
    // the user can free space, and everything we persist is small.
    available =
      error instanceof DOMException &&
      error.name === "QuotaExceededError" &&
      storage.length > 0;
  }

  cachedAvailability = available;

  return available;
}
