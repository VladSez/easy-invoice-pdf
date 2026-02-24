"use client";

import {
  METADATA_LOCAL_STORAGE_KEY,
  metadataSchema,
  SCHEMA_VERSION,
  APP_VERSION,
  type Metadata,
  DEFAULT_MOBILE_TAB,
} from "@/app/schema";
import * as Sentry from "@sentry/nextjs";
import dayjs from "dayjs";

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
    const metadata = localStorage.getItem(METADATA_LOCAL_STORAGE_KEY);

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
      localStorage.setItem(
        METADATA_LOCAL_STORAGE_KEY,
        JSON.stringify(DEFAULT_METADATA),
      );

      Sentry.captureException(parsed.error);

      return;
    }

    // save the updated metadata to local storage
    localStorage.setItem(
      METADATA_LOCAL_STORAGE_KEY,
      JSON.stringify(parsed.data),
    );
  } catch (error) {
    console.error("[updateAppMetadata] Failed to save metadata:", error);
    Sentry.captureException(error);
  }
}
