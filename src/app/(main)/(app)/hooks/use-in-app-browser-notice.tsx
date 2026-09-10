"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useDeviceContext } from "@/contexts/device-context";
import { isTelegramInAppBrowser } from "@/utils/is-telegram-in-app-browser";

/**
 * Warns the user once when the page is opened inside an in-app browser / WebView
 * (Instagram, X, LinkedIn, Telegram, ...), where downloads are blocked.
 *
 * The notice is about the page as a whole, so it belongs here and not on the download
 * button: that button is rendered from two places (the desktop header and the mobile
 * bottom bar), and the warning is just as relevant when neither of them is on screen.
 */
export function useInAppBrowserNotice() {
  const { inAppInfo, isDesktop } = useDeviceContext();
  const isMobile = !isDesktop;

  // Guards the toast so it only shows once per mount. A ref, not state: nothing
  // in the render output depends on it.
  const noticeShownRef = useRef(false);

  useEffect(() => {
    if (noticeShownRef.current) {
      return;
    }

    // `isTelegramInAppBrowser` reads `window`, so it has to run on the client
    if (!inAppInfo?.isInApp && !isTelegramInAppBrowser()) {
      return;
    }

    noticeShownRef.current = true;

    toast.info("In-App Browser Detected", {
      description: (
        <p>
          For the best experience, please open this page in{" "}
          <span className="font-bold">Chrome</span> or{" "}
          <span className="font-bold">Safari</span> browser.
        </p>
      ),
      id: "in-app-browser-toast", // To prevent duplicate toasts
      duration: Infinity,
      icon: "⚠️",
      position: isMobile ? "top-center" : "bottom-right",
    });
  }, [inAppInfo?.isInApp, isMobile]);
}
