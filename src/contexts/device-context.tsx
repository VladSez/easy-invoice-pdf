"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import type { InAppInfo } from "@/lib/check-device.server";
import { createContext, useContext, useEffect, useState } from "react";

interface DeviceContextType {
  isDesktop: boolean;
  isAndroid: boolean;
  isWebView: boolean;
  isMobile: boolean;
  inAppInfo: InAppInfo;
  userAgent: string;
}

const DeviceContext = createContext<DeviceContextType | null>(null);

export function useDeviceContext() {
  const context = useContext(DeviceContext);

  if (!context) {
    throw new Error("useDeviceContext must be used within a DeviceProvider");
  }
  return context;
}

export function DeviceContextProvider({
  children,
  isDesktop,
  isAndroid,
  isWebView,
  isMobile,
  inAppInfo,
  userAgent,
}: DeviceContextType & { children: React.ReactNode }) {
  const [isDesktopClient, setIsDesktopClient] = useState(isDesktop);

  // Check media query on client side as an additional check
  const isMediaQueryDesktop = useIsDesktop();

  /**
   * Update the client state if the media query is defined
   * This is to ensure that the client state is always up to date
   */
  useEffect(() => {
    if (isMediaQueryDesktop !== undefined) {
      setIsDesktopClient(isMediaQueryDesktop);
    }
  }, [isMediaQueryDesktop]);

  return (
    <DeviceContext.Provider
      value={{
        isDesktop: isDesktopClient,
        isAndroid,
        isWebView,
        isMobile,
        inAppInfo,
        userAgent,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}
