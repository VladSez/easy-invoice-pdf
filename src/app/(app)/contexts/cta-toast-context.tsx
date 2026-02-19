"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface CTAToastContextValue {
  /** Whether the user has triggered a CTA-eligible action (PDF download or link generation) this session */
  hasTriggeredCTAAction: boolean;
  /** Mark that a CTA-eligible action was triggered (disables idle toast) */
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
  const [hasTriggeredCTAAction, setHasTriggeredCTAAction] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);

  const markCTAActionTriggered = useCallback(() => {
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
