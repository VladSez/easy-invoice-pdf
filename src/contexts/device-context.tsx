"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

import { useIsDesktop } from "@/hooks/use-media-query";
import {
  detectDevice,
  SERVER_DEVICE_INFO,
  type DeviceInfo,
  type InAppInfo,
} from "@/lib/detect-device";

interface DeviceContextType {
  isDesktop: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  inAppInfo: InAppInfo;
  /**
   * we use this when generating the invoice link, to show navigagor.share or copy to clipboard
   */
  isUADesktop: boolean;
}

const DeviceContext = createContext<DeviceContextType | null>(null);

export function useDeviceContext() {
  const context = useContext(DeviceContext);

  if (!context) {
    throw new Error("useDeviceContext must be used within a DeviceProvider");
  }
  return context;
}

/**
 * Provides the device detected from the browser's user agent.
 *
 * The invoice app is prerendered, so there is no request to read the user agent from on
 * the server: the prerendered HTML assumes a desktop (`SERVER_DEVICE_INFO`) and the real
 * values take over right after hydration.
 */
export function UserAgentDeviceContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const deviceInfo = useSyncExternalStore(
    subscribeToUserAgent,
    getClientDeviceInfo,
    getServerDeviceInfo,
  );

  return (
    <DeviceContextProvider {...deviceInfo}>{children}</DeviceContextProvider>
  );
}

export function DeviceContextProvider({
  children,
  isDesktop,
  isAndroid,
  isMobile,
  inAppInfo,
}: DeviceInfo & { children: React.ReactNode }) {
  // Check media query on client side as an additional check, we use this to show
  // either desktop or mobile (tabs) UI. `undefined` until it has been read in an effect.
  const isMediaQueryDesktop = useIsDesktop();

  return (
    <DeviceContext.Provider
      value={{
        isDesktop: isMediaQueryDesktop ?? isDesktop,
        isAndroid,
        isMobile,
        inAppInfo,
        /**
         * we use this when generating the invoice link, to show navigagor.share or copy to clipboard
         */
        isUADesktop: isDesktop,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

/** The user agent never changes during the lifetime of the page. */
function subscribeToUserAgent() {
  return () => {
    // nothing to unsubscribe from
  };
}

let clientDeviceInfo: DeviceInfo | null = null;

/**
 * `useSyncExternalStore` compares snapshots by identity, so the result is computed once
 * and reused rather than returning a fresh object on every render.
 */
function getClientDeviceInfo() {
  clientDeviceInfo ??= detectDevice({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
  });

  return clientDeviceInfo;
}

function getServerDeviceInfo() {
  return SERVER_DEVICE_INFO;
}
