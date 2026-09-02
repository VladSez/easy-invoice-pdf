// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";

import {
  safeLocalStorageGetItem,
  safeLocalStorageSetItem,
} from "../safe-local-storage";

const KEY = "TEST_KEY";

const originalDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "localStorage",
);

/** Replaces `window.localStorage` with whatever a hostile environment hands us. */
function stubLocalStorage(get: () => unknown) {
  Object.defineProperty(window, "localStorage", { configurable: true, get });
}

afterEach(() => {
  if (originalDescriptor) {
    Object.defineProperty(window, "localStorage", originalDescriptor);
  } else {
    // @ts-expect-error -- removing the stub falls back to the prototype getter
    delete window.localStorage;
  }

  localStorage.clear();
});

describe("safeLocalStorageGetItem", () => {
  it("reads a stored value", () => {
    localStorage.setItem(KEY, "stored");

    expect(safeLocalStorageGetItem(KEY)).toBe("stored");
  });

  it("returns null for an unset key", () => {
    expect(safeLocalStorageGetItem(KEY)).toBeNull();
  });

  it("returns null when localStorage is null (iOS in-app webview)", () => {
    stubLocalStorage(() => {
      return null;
    });

    expect(safeLocalStorageGetItem(KEY)).toBeNull();
  });

  it("returns null when the property access throws (Safari, cookies blocked)", () => {
    stubLocalStorage(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });

    expect(safeLocalStorageGetItem(KEY)).toBeNull();
  });

  it("returns null when getItem itself throws", () => {
    stubLocalStorage(() => {
      return {
        getItem() {
          throw new Error("nope");
        },
      };
    });

    expect(safeLocalStorageGetItem(KEY)).toBeNull();
  });
});

describe("safeLocalStorageSetItem", () => {
  it("persists a value and reports success", () => {
    expect(safeLocalStorageSetItem({ key: KEY, value: "written" })).toBe(true);
    expect(localStorage.getItem(KEY)).toBe("written");
  });

  it("reports failure when localStorage is null", () => {
    stubLocalStorage(() => {
      return null;
    });

    expect(safeLocalStorageSetItem({ key: KEY, value: "written" })).toBe(false);
  });

  it("reports failure when the write is rejected (quota exceeded)", () => {
    stubLocalStorage(() => {
      return {
        setItem() {
          throw new DOMException("Quota exceeded.", "QuotaExceededError");
        },
      };
    });

    expect(safeLocalStorageSetItem({ key: KEY, value: "written" })).toBe(false);
  });
});
