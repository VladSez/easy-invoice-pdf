"use client";

import * as Sentry from "@sentry/nextjs";
import dayjs from "dayjs";

import {
  getAppStorageItem,
  setAppStorageItem,
} from "@/app/(main)/(app)/utils/app-local-storage";
import {
  METADATA_LOCAL_STORAGE_KEY,
  metadataSchema,
  SCHEMA_VERSION,
  APP_VERSION,
  type Metadata,
  DEFAULT_MOBILE_TAB,
} from "@/app/schema";

export const DEFAULT_METADATA = {
  appVersion: APP_VERSION,
  schemaVersion: SCHEMA_VERSION,
  /** when the invoice was created (i.e. invoice is first created) */
  invoiceCreatedAt: dayjs().toISOString(),
  /** when the invoice was last updated (i.e. invoice is regenerated) */
  invoiceLastUpdatedAt: dayjs().toISOString(),
  lastVisitedMobileTab: DEFAULT_MOBILE_TAB,
  /** how many times the invoice PDF has been downloaded */
  invoiceDownloadCount: 0,
  /** how many times the invoice has been shared via link */
  invoiceSharedCount: 0,
} as const satisfies Metadata;

/**
 * Subscribers to the metadata store, notified after every successful write.
 *
 * `localStorage` has no change event for the tab that wrote it, so a component reading
 * metadata has no way of hearing about its own app's updates. This is that event.
 */
const appMetadataListeners = new Set<() => void>();

function notifyAppMetadataListeners() {
  for (const listener of appMetadataListeners) {
    listener();
  }
}

/**
 * Subscribes to app metadata writes. Shaped for `useSyncExternalStore`.
 *
 * @param onStoreChange - Called after every write made through {@link updateAppMetadata}.
 * @returns The unsubscribe function.
 */
export function subscribeToAppMetadata(onStoreChange: () => void) {
  appMetadataListeners.add(onStoreChange);

  return () => {
    appMetadataListeners.delete(onStoreChange);
  };
}

/** The last value {@link getAppMetadataSnapshot} returned, and the raw string it came from. */
let cachedRawMetadata: string | null = null;
let cachedMetadata: Metadata | null = null;
let hasCachedMetadata = false;

/**
 * The current metadata, as a value that keeps its identity until the stored string changes.
 *
 * {@link getAppMetadata} parses and validates on every call and so hands back a new object
 * each time -- fine for a one-off read in an effect, but `useSyncExternalStore` compares
 * snapshots by identity and would spin forever on it. Caching against the raw string also
 * means the `JSON.parse` and the zod validation only run when the metadata actually changed,
 * rather than on every render of every component that displays it.
 */
export function getAppMetadataSnapshot(): Metadata | null {
  const raw = getAppStorageItem(METADATA_LOCAL_STORAGE_KEY);

  if (hasCachedMetadata && raw === cachedRawMetadata) {
    return cachedMetadata;
  }

  cachedRawMetadata = raw;
  cachedMetadata = getAppMetadata();
  hasCachedMetadata = true;

  return cachedMetadata;
}

/**
 * Metadata as seen while server rendering: there is no `localStorage` there.
 *
 * A separate function from the client snapshot because React requires a server snapshot to
 * be constant, and it must not be the cached client value.
 */
export function getServerAppMetadataSnapshot(): Metadata | null {
  return null;
}

/**
 * Retrieves and validates the app metadata from **local storage**.
 *
 * The metadata schema includes:
 * - appVersion: the app version
 * - schemaVersion: the schema version of the app's data model
 * - invoiceCreatedAt: when the invoice was created (i.e. invoice is first created)
 * - invoiceLastUpdatedAt: when the invoice was last updated (i.e. invoice is regenerated)
 * - lastVisitedMobileTab: the last visited mobile tab (for better UX)
 */
export function getAppMetadata() {
  try {
    const metadata = getAppStorageItem(METADATA_LOCAL_STORAGE_KEY);

    if (!metadata) return null;

    const parsedMetadata = JSON.parse(metadata) as Metadata;
    const validatedMetadata = metadataSchema.safeParse(parsedMetadata);

    if (!validatedMetadata.success) {
      console.error(
        "[getAppMetadata] Error validating app metadata:",
        validatedMetadata.error,
      );

      Sentry.captureException(validatedMetadata.error);

      return null;
    }

    return validatedMetadata?.data;
  } catch (error) {
    console.error("[getAppMetadata] Error parsing invoice metadata:", error);

    Sentry.captureException(error);

    return null;
  }
}
/**
 * Overwrites the stored metadata with the defaults.
 *
 * Note this is *not* expressible as an `updateAppMetadata` call: that one reads the current
 * metadata first and bails when there is none, which is exactly the situation both callers of
 * {@link ensureAppMetadata} are in.
 */
export function resetAppMetadata() {
  setAppStorageItem({
    key: METADATA_LOCAL_STORAGE_KEY,
    value: JSON.stringify(DEFAULT_METADATA),
  });

  notifyAppMetadataListeners();
}

/**
 * Seeds the defaults for anyone who has none stored yet -- a first-time visitor, or someone
 * who used the app before metadata existed.
 *
 * Lives here rather than at the call sites so that every write to the metadata key goes
 * through this module and therefore notifies {@link subscribeToAppMetadata}. The call sites
 * used to write `localStorage` directly, which was invisible to subscribers; harmless while
 * both of them ran before anything had subscribed, but only by accident.
 */
export function ensureAppMetadata() {
  if (getAppMetadata()) {
    return;
  }

  resetAppMetadata();
}

/**
 * Updates the app metadata in **local storage** using an updater function.
 *
 * This function retrieves the current metadata, applies the updater function to it,
 * validates the result, and saves it back to local storage.
 *
 * @param updater - A function that receives the current metadata and returns the updated metadata
 *
 * @example
 * ```typescript
 * updateAppMetadata((current) => ({
 *   ...current,
 *   invoiceLastUpdatedAt: dayjs().toISOString(),
 * }));
 * ```
 *
 * @remarks
 * - If no existing metadata is found, the function returns early without updating
 * - Validates the updated metadata against the metadataSchema before saving
 * - Logs validation errors and exceptions to console and Sentry
 * - Does not throw errors; failures are logged and handled gracefully
 */
export function updateAppMetadata(updater: (current: Metadata) => Metadata) {
  try {
    const existingMetadata = getAppMetadata();

    if (!existingMetadata) {
      return;
    }

    const nextMetadata = updater(existingMetadata);

    const parsed = metadataSchema.safeParse(nextMetadata);

    if (!parsed.success) {
      console.error("[updateAppMetadata] Validation error:", parsed.error);

      // reset the metadata to default if validation fails, we want to fail silently and not block the app
      resetAppMetadata();

      Sentry.captureException(parsed.error);

      return;
    }

    // save the updated metadata to local storage
    setAppStorageItem({
      key: METADATA_LOCAL_STORAGE_KEY,
      value: JSON.stringify(parsed.data),
    });

    notifyAppMetadataListeners();
  } catch (error) {
    console.error("[updateAppMetadata] Failed to save metadata:", error);
    Sentry.captureException(error);
  }
}
