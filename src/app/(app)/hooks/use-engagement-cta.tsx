"use client";

import { useEffect } from "react";
import { showRandomCTAToast } from "../components/cta-toasts";

const CTA_TOAST_SHOWN_LOCAL_STORAGE_KEY = "EASY_INVOICE_CTA_TOAST_SHOWN";
const INTERACTION_COUNT_THRESHOLD = 2;
const DELAY_BEFORE_SHOWING_CTA_TOAST = 15_000;

/**
 * This hook is used to show a CTA toast after a certain number of interactions with the page.
 */
export function useShowRandomCTAToastOnEngagement() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const hasShown = localStorage.getItem(CTA_TOAST_SHOWN_LOCAL_STORAGE_KEY);
    if (hasShown) return;

    let interactionCount = 0;
    const handleInteraction = () => {
      interactionCount++;

      if (interactionCount === INTERACTION_COUNT_THRESHOLD) {
        const timer = setTimeout(() => {
          showRandomCTAToast();
          localStorage.setItem(CTA_TOAST_SHOWN_LOCAL_STORAGE_KEY, "true");
        }, DELAY_BEFORE_SHOWING_CTA_TOAST);

        window.removeEventListener("click", handleInteraction);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("click", handleInteraction);
    return () => window.removeEventListener("click", handleInteraction);
  }, []);
}
