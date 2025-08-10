"use client";

// localStorage-debug-listener.ts
let isInitialized = false;

/**
 * This function initializes the localStorage debugger for listening to localStorage changes in the same tab.
 * It is used to debug the localStorage data in the same tab.
 *
 */
export function initializeLocalStorageDebugger() {
  if (
    typeof window === "undefined" ||
    typeof localStorage === "undefined" ||
    typeof document === "undefined" ||
    isInitialized
  ) {
    return;
  }

  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    console.debug(`[localStorage] setItem: ${key} = ${value}`);
    const event = new CustomEvent("local-storage-change", {
      detail: { key, value, type: "setItem" },
    });
    window.dispatchEvent(event);
    originalSetItem.call(this, key, value);
  };

  const originalRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function (key) {
    console.debug(`[localStorage] removeItem: ${key}`);
    const event = new CustomEvent("local-storage-change", {
      detail: { key, type: "removeItem" },
    });
    window.dispatchEvent(event);
    originalRemoveItem.call(this, key);
  };

  const originalClear = localStorage.clear;
  localStorage.clear = function () {
    console.debug(`[localStorage] clear`);
    const event = new CustomEvent("local-storage-change", {
      detail: { type: "clear" },
    });
    window.dispatchEvent(event);
    originalClear.call(this);
  };

  isInitialized = true;
  console.debug("[localStorage] Debug listener initialized");
}

export interface LocalStorageChangeEvent extends CustomEvent {
  detail: {
    key?: string;
    value?: string;
    type: "setItem" | "removeItem" | "clear";
  };
}
