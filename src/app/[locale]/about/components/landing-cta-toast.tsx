"use client";

import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { useEffect } from "react";
import { showRandomCTAToast } from "@/app/(app)/components/cta-toasts";

/**
 * This component is used to show a CTA toast on the landing page.
 */
export const LandingCtaToast = () => {
  useEffect(() => {
    const showCTAToast = () => {
      showRandomCTAToast();

      umamiTrackEvent("cta_toast_shown_landing_page");
    };

    // Show cta toast after X seconds on the page
    const initialTimer = setTimeout(showCTAToast, 15_000);

    return () => {
      clearTimeout(initialTimer);
    };
  }, []);

  return null;
};
