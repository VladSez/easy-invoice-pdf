"use client";

import {
  customDefaultToast,
  customPremiumToast,
} from "@/app/(app)/components/cta-toasts";
import { useEffect } from "react";

/**
 * This component is used to show a CTA toast on the landing page.
 *
 * It is used to encourage users to support the project.
 *
 * It is only shown on the production environment.
 *
 * It is shown after 7 seconds on the page.
 *
 */
export const LandingCtaToast = () => {
  // Show CTA toast every minute
  useEffect(() => {
    // only show on production
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    const showCTAToast = () => {
      // Randomly show either default or premium donation toast
      if (Math.random() <= 0.5) {
        customPremiumToast({
          id: "premium-donation-toast-landing-page",
          title: "Support My Work",
          description:
            "Your contribution helps me maintain and improve this project for everyone! 🚀",
        });
      } else {
        customDefaultToast({
          id: "default-donation-toast-landing-page",
          title: "Love this project?",
          description:
            "Help me keep building amazing tools! Your support means the world to me. ✨",
        });
      }
    };

    // Show cta toast after 15 seconds on the page
    const initialTimer = setTimeout(showCTAToast, 15_000);

    return () => {
      clearTimeout(initialTimer);
    };
  }, []);

  return null;
};
