"use client";

import type { LocalStorageKey } from "@/app/schema";
import {
  safeLocalStorageGetItem,
  safeLocalStorageSetItem,
} from "@/lib/safe-local-storage";

/**
 * `localStorage` accessors restricted to the keys the app actually owns.
 *
 * These are the ones app code should reach for. The helpers in `@/lib/safe-local-storage`
 * they wrap are deliberately key-agnostic — that module knows nothing about invoices, so
 * it stays testable on its own — and this layer adds the part that is app knowledge:
 * only a key listed in `LOCAL_STORAGE_KEYS` can be read or written, so a typo, or a key
 * invented in one feature and never written down, does not compile.
 *
 * Failure handling is inherited unchanged: neither function throws, a read of an
 * unavailable store is indistinguishable from an unset key (`null`), and a write reports
 * whether it landed.
 */
export function getAppStorageItem(key: LocalStorageKey): string | null {
  return safeLocalStorageGetItem(key);
}

interface SetAppStorageItemOptions {
  /** The key to write to. Must be one of the app's declared keys. */
  key: LocalStorageKey;
  /** The value to persist. Serialize non-strings before calling. */
  value: string;
}

/**
 * @returns `true` when the value was persisted, `false` when storage was unavailable or
 * the write was rejected (private mode, quota exceeded).
 */
export function setAppStorageItem({
  key,
  value,
}: SetAppStorageItemOptions): boolean {
  return safeLocalStorageSetItem({ key, value });
}
