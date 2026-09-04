"use client";

import { createContext, useContext, useState, useCallback } from "react";

import {
  getAppStorageItem,
  setAppStorageItem,
} from "@/app/(app)/utils/app-local-storage";
import { CTA_TOAST_STORAGE_KEY } from "@/app/schema";

const CTA_TOAST_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 1 day

function isCTAToastInCooldown() {
  const stored = getAppStorageItem(CTA_TOAST_STORAGE_KEY);

  if (!stored) return false;

  // if the timestamp is older than a day, return false
  return Date.now() - Number(stored) < CTA_TOAST_COOLDOWN_MS;
}

function setCTAToastShownTimestamp() {
  setAppStorageItem({
    key: CTA_TOAST_STORAGE_KEY,
    value: String(Date.now()),
  });
}

interface CTAToastContextValue {
  /** Whether a CTA toast was shown within the last 24 hours (persisted in localStorage) */
  hasTriggeredCTAAction: boolean;
  /** Mark that a CTA toast was shown — persists timestamp to localStorage */
  markCTAActionTriggered: () => void;
}

const CTAToastContext = createContext<CTAToastContextValue | undefined>(
  undefined,
);

export function CTAToastProvider({ children }: { children: React.ReactNode }) {
  const [hasTriggeredCTAAction, setHasTriggeredCTAAction] = useState(() => {
    return isCTAToastInCooldown();
  });

  const markCTAActionTriggered = useCallback(() => {
    setCTAToastShownTimestamp();
    setHasTriggeredCTAAction(true);
  }, []);

  return (
    <CTAToastContext.Provider
      value={{
        hasTriggeredCTAAction,
        markCTAActionTriggered,
      }}
    >
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
