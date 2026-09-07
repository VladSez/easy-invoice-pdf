"use client";

import { useSyncExternalStore } from "react";

import {
  getAppMetadataSnapshot,
  getServerAppMetadataSnapshot,
  subscribeToAppMetadata,
} from "@/app/(main)/(app)/utils/get-app-metadata";

/**
 * The app metadata held in `localStorage`, as reactive state.
 *
 * Components used to call `getAppMetadata()` straight from their render, which read, parsed
 * and validated the stored JSON on every single render, and read a mutable store from a
 * place React expects to be pure. That it stayed fresh at all was incidental: it only
 * updated because something else happened to re-render the component at the same time.
 *
 * Subscribing instead makes the refresh causal -- a write through `updateAppMetadata`
 * re-renders exactly the components displaying it -- and the parse happens once per change
 * rather than once per render.
 *
 * @returns The current metadata, or `null` when nothing is stored yet (or on the server).
 */
export function useAppMetadata() {
  return useSyncExternalStore(
    subscribeToAppMetadata,
    getAppMetadataSnapshot,
    getServerAppMetadataSnapshot,
  );
}
