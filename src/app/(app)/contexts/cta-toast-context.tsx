"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface CTAToastContextValue {
  isToastShownInSession: boolean;
  markToastAsShown: () => void;
}

const CTAToastContext = createContext<CTAToastContextValue | undefined>(
  undefined,
);

export function CTAToastProvider({ children }: { children: React.ReactNode }) {
  const [isToastShownInSession, setIsToastShownInSession] = useState(false);

  const markToastAsShown = useCallback(() => {
    setIsToastShownInSession(true);
  }, []);

  return (
    <CTAToastContext.Provider
      value={{ isToastShownInSession, markToastAsShown }}
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
