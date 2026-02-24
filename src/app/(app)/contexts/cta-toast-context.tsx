"use client";

import { createContext, useContext, useState, useCallback } from "react";

const CTA_TOAST_STORAGE_KEY = "EASY_INVOICE_CTA_LAST_SHOWN_AT";
const CTA_TOAST_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isCTAToastInCooldown() {
  try {
    const stored = localStorage.getItem(CTA_TOAST_STORAGE_KEY);
    if (!stored) return false;

    // if the timestamp is older than 7 days, return false
    return Date.now() - Number(stored) < CTA_TOAST_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function setCTAToastShownTimestamp() {
  try {
    localStorage.setItem(CTA_TOAST_STORAGE_KEY, String(Date.now()));
  } catch {}
}

interface CTAToastContextValue {
  /** Whether a CTA toast was shown within the last 7 days (persisted in localStorage) */
  hasTriggeredCTAAction: boolean;
  /** Mark that a CTA toast was shown — persists timestamp to localStorage */
  markCTAActionTriggered: () => void;
  /** Number of meaningful interactions (form updates) this session (used to determine if we should show CTA toast) */
  interactionCount: number;
  /** Increment the interaction counter (call on each form update/pdf re-render) - used to determine if we should show CTA toast */
  incrementInteractionCount: () => void;
}

const CTAToastContext = createContext<CTAToastContextValue | undefined>(
  undefined,
);

export function CTAToastProvider({ children }: { children: React.ReactNode }) {
  const [hasTriggeredCTAAction, setHasTriggeredCTAAction] = useState(() =>
    isCTAToastInCooldown(),
  );
  const [interactionCount, setInteractionCount] = useState(0);

  const markCTAActionTriggered = useCallback(() => {
    setCTAToastShownTimestamp();
    setHasTriggeredCTAAction(true);
  }, []);

  const incrementInteractionCount = useCallback(() => {
    setInteractionCount((prevCount) => prevCount + 1);
  }, []);

  return (
    <CTAToastContext.Provider
      value={{
        hasTriggeredCTAAction,
        markCTAActionTriggered,
        interactionCount,
        incrementInteractionCount,
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
