"use client";

import dayjs from "dayjs";
import { createContext, useContext, useState, useCallback } from "react";

/** 3-minute cooldown between CTA toasts within the same session */
const CTA_TOAST_COOLDOWN_MS = 3 * 60 * 1000;

interface CTAToastContextValue {
  /** Whether a CTA toast can be shown (first time or 5+ min since last) */
  canShowCTAToast: boolean;
  /** Record that a CTA toast was just shown */
  markCTAToastAsShown: () => void;
}

const CTAToastContext = createContext<CTAToastContextValue | undefined>(
  undefined,
);

export function CTAToastProvider({ children }: { children: React.ReactNode }) {
  const [lastCTAToastShownAt, setLastCTAToastShownAt] = useState<number | null>(
    null,
  );

  const canShowCTAToast =
    lastCTAToastShownAt === null ||
    Date.now() - lastCTAToastShownAt >= CTA_TOAST_COOLDOWN_MS;

  const markCTAToastAsShown = useCallback(() => {
    setLastCTAToastShownAt(Date.now());
  }, []);

  console.log("[CTAToastProvider] canShowCTAToast", {
    canShowCTAToast,
    lastCTAToastShownAt: lastCTAToastShownAt
      ? dayjs(lastCTAToastShownAt).format("YYYY-MM-DD HH:mm:ss")
      : null,
    CTA_TOAST_COOLDOWN_MS,
  });

  return (
    <CTAToastContext.Provider value={{ canShowCTAToast, markCTAToastAsShown }}>
      {children}
    </CTAToastContext.Provider>
  );
}

export function useCTAToast() {
  const context = useContext(CTAToastContext);

  if (context === undefined) {
    throw new Error("useCTAToast must be used within a CTAToastProvider");
  }

  return context;
}
