// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "localStorage",
);

/** Replaces `window.localStorage` with whatever a hostile environment hands us. */
function stubLocalStorage(get: () => unknown) {
  Object.defineProperty(window, "localStorage", { configurable: true, get });
}

/**
 * The probe memoizes its answer for the lifetime of the module, so every test needs a
 * fresh copy to probe the storage it just stubbed.
 */
async function importFreshProbe() {
  vi.resetModules();

  const { isLocalStorageAvailable } = await import("../safe-local-storage");

  return isLocalStorageAvailable;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  if (originalDescriptor) {
    Object.defineProperty(window, "localStorage", originalDescriptor);
  }
});

describe("isLocalStorageAvailable", () => {
  it("is true for a working store", async () => {
    const isLocalStorageAvailable = await importFreshProbe();

    expect(isLocalStorageAvailable()).toBe(true);
  });

  it("leaves no probe key behind", async () => {
    const isLocalStorageAvailable = await importFreshProbe();

    isLocalStorageAvailable();

    expect(localStorage).toHaveLength(0);
  });

  it("is false when localStorage is null (iOS in-app webview)", async () => {
    stubLocalStorage(() => {
      return null;
    });

    const isLocalStorageAvailable = await importFreshProbe();

    expect(isLocalStorageAvailable()).toBe(false);
  });

  it("is false when the store accepts reads but rejects every write", async () => {
    stubLocalStorage(() => {
      return {
        length: 0,
        getItem() {
          return null;
        },
        setItem() {
          throw new DOMException("Quota exceeded.", "QuotaExceededError");
        },
      };
    });

    const isLocalStorageAvailable = await importFreshProbe();

    expect(isLocalStorageAvailable()).toBe(false);
  });

  it("is true for a full store that already holds data, since the user can free space", async () => {
    stubLocalStorage(() => {
      return {
        length: 3,
        getItem() {
          return null;
        },
        setItem() {
          throw new DOMException("Quota exceeded.", "QuotaExceededError");
        },
      };
    });

    const isLocalStorageAvailable = await importFreshProbe();

    expect(isLocalStorageAvailable()).toBe(true);
  });

  it("probes only once", async () => {
    const setItem = vi.fn();

    stubLocalStorage(() => {
      return {
        length: 0,
        getItem() {
          return null;
        },
        setItem,
        removeItem: vi.fn(),
      };
    });

    const isLocalStorageAvailable = await importFreshProbe();

    isLocalStorageAvailable();
    isLocalStorageAvailable();
    isLocalStorageAvailable();

    expect(setItem).toHaveBeenCalledTimes(1);
  });
});
