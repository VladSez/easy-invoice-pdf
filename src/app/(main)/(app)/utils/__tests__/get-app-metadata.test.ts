// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { METADATA_LOCAL_STORAGE_KEY } from "@/app/schema";

/**
 * A fresh copy of the module for every test.
 *
 * The snapshot cache and the listener set live at module scope, which is the point of them --
 * but it also means one test's subscribers and cached value would otherwise leak into the next.
 */
async function loadStore() {
  vi.resetModules();

  return import("../get-app-metadata");
}

beforeEach(() => {
  localStorage.clear();
});

describe("app metadata store", () => {
  it("seeds the defaults when nothing is stored, and tells subscribers", async () => {
    const { ensureAppMetadata, subscribeToAppMetadata } = await loadStore();
    const onChange = vi.fn();
    subscribeToAppMetadata(onChange);

    expect(localStorage.getItem(METADATA_LOCAL_STORAGE_KEY)).toBeNull();

    ensureAppMetadata();

    expect(localStorage.getItem(METADATA_LOCAL_STORAGE_KEY)).not.toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("leaves metadata that is already there alone", async () => {
    const {
      ensureAppMetadata,
      getAppMetadata,
      subscribeToAppMetadata,
      updateAppMetadata,
    } = await loadStore();

    ensureAppMetadata();
    updateAppMetadata((current) => {
      return { ...current, invoiceDownloadCount: 7 };
    });

    // subscribed only now, so the seeding above cannot account for a call
    const onChange = vi.fn();
    subscribeToAppMetadata(onChange);

    ensureAppMetadata();

    expect(getAppMetadata()?.invoiceDownloadCount).toBe(7);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("tells subscribers about an update", async () => {
    const { ensureAppMetadata, subscribeToAppMetadata, updateAppMetadata } =
      await loadStore();
    ensureAppMetadata();

    const onChange = vi.fn();
    subscribeToAppMetadata(onChange);

    updateAppMetadata((current) => {
      return { ...current, invoiceSharedCount: 3 };
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("tells subscribers about a reset, and overwrites what was there", async () => {
    const {
      ensureAppMetadata,
      getAppMetadata,
      resetAppMetadata,
      subscribeToAppMetadata,
      updateAppMetadata,
    } = await loadStore();
    ensureAppMetadata();
    updateAppMetadata((current) => {
      return { ...current, invoiceSharedCount: 5 };
    });

    const onChange = vi.fn();
    subscribeToAppMetadata(onChange);

    resetAppMetadata();

    expect(getAppMetadata()?.invoiceSharedCount).toBe(0);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("stops telling a subscriber that unsubscribed", async () => {
    const { ensureAppMetadata, subscribeToAppMetadata, updateAppMetadata } =
      await loadStore();
    ensureAppMetadata();

    const onChange = vi.fn();
    const unsubscribe = subscribeToAppMetadata(onChange);
    unsubscribe();

    updateAppMetadata((current) => {
      return { ...current, invoiceSharedCount: 1 };
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  // `useSyncExternalStore` re-renders whenever the snapshot's identity changes, so a getter
  // that parsed afresh on every call would loop forever.
  it("hands back the same snapshot until the stored value changes", async () => {
    const { ensureAppMetadata, getAppMetadataSnapshot, updateAppMetadata } =
      await loadStore();
    ensureAppMetadata();

    const first = getAppMetadataSnapshot();

    expect(getAppMetadataSnapshot()).toBe(first);
    expect(getAppMetadataSnapshot()).toBe(first);

    updateAppMetadata((current) => {
      return { ...current, invoiceDownloadCount: 2 };
    });

    const second = getAppMetadataSnapshot();

    expect(second).not.toBe(first);
    expect(second?.invoiceDownloadCount).toBe(2);
  });

  it("reports no metadata when the store is empty", async () => {
    const { getAppMetadataSnapshot } = await loadStore();

    expect(getAppMetadataSnapshot()).toBeNull();
  });
});
