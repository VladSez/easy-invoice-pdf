"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useIsDesktop } from "@/hooks/use-media-query";
import { getBrowserSupport } from "@/utils/browser-support";

/**
 * Nudges visitors on a stale browser to update, once per page load.
 *
 * Mounted from the shared root document, so it covers the invoice generator and the
 * marketing pages alike: everything here (client-side PDF rendering above all) leans
 * hard on the browser, and a three year old Safari is where the odd unreproducible
 * bug report tends to come from.
 *
 * Renders nothing — it only fires a toast, and lives as a component rather than a
 * hook so it can be dropped into the (server) root document directly.
 */
export function BrowserSupportNotice() {
  const t = useTranslations("BrowserSupport");
  const isDesktop = useIsDesktop();

  // Guards the toast so it only shows once per mount. A ref, not state: nothing in
  // the render output depends on it.
  const noticeShownRef = useRef(false);

  useEffect(() => {
    // `useIsDesktop` is `undefined` until its media query has been read in an
    // effect. Waiting for it keeps the toast from opening in the mobile position
    // on a desktop; it resolves on the very next commit.
    if (noticeShownRef.current || isDesktop === undefined) {
      return;
    }

    const support = getBrowserSupport(window.navigator.userAgent);

    // `null` is an unrecognised browser, and most visitors are simply up to date
    if (!support || support.status === "supported") {
      return;
    }

    noticeShownRef.current = true;

    const { status, name, majorVersion } = support;
    const showToast = status === "unsupported" ? toast.warning : toast.info;

    showToast(t(`${status}.title`), {
      description: t(`${status}.description`, {
        browser: name,
        version: String(majorVersion),
      }),
      id: "browser-support-toast", // To prevent duplicate toasts
      duration: Infinity,
      icon: "⚠️",
      position: isDesktop ? "bottom-right" : "top-center",
    });
  }, [isDesktop, t]);

  return null;
}
