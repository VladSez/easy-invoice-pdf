"use client";

import { useEffect } from "react";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { showRandomCTAToast } from "../components/cta-toasts";
import { useCTAToast } from "../contexts/cta-toast-context";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

export const CTA_TOAST_LAST_SHOWN_STORAGE_KEY =
  "EASY_INVOICE_CTA_LAST_SHOWN_AT";
const COOLDOWN_DAYS = 7;
const MIN_TIME_ON_PAGE = 10_000; // in ms
const IDLE_TIME = 7_000; // in ms

/**
 * This hook is used to show a CTA toast after a certain number of interactions with the page.
 *
 * - User stays on page Xs (MIN_TIME_ON_PAGE) → we consider them "present".
 * - Any real interaction (type, click) → we mark them engaged.
 * - Once they stop interacting for X seconds (IDLE_TIME) → toast appears.
 */
export function useShowRandomCTAToast() {
  const { isToastShownInSession, markToastAsShown } = useCTAToast();

  useEffect(() => {
    // Skip if a CTA toast was already shown in this session (e.g., from PDF download)
    if (isToastShownInSession) {
      umamiTrackEvent("cta_toast_skipped_session");
      return;
    }
    const last = localStorage.getItem(CTA_TOAST_LAST_SHOWN_STORAGE_KEY);

    // Check if the last time the CTA toast was shown was less than 7 days ago
    // Parse and validate the stored timestamp
    const parsedLast = last ? Number(last) : NaN;
    const isValidTimestamp = Number.isFinite(parsedLast);

    // If invalid timestamp, clear it from storage and treat as not in cooldown
    if (last && !isValidTimestamp) {
      localStorage.removeItem(CTA_TOAST_LAST_SHOWN_STORAGE_KEY);
    }

    const isWithinCooldownPeriod =
      isValidTimestamp &&
      dayjs().diff(dayjs(parsedLast)) <
        dayjs.duration(COOLDOWN_DAYS, "day").asMilliseconds();

    // If the last time any CTA toast was shown was less than 7 days ago, skip showing the toast
    // This includes both the random CTA toast and the PDF download donation toast
    if (last && isWithinCooldownPeriod) {
      umamiTrackEvent("cta_toast_skipped_recently");
      return;
    }

    let timeOnPageTimer: ReturnType<typeof setTimeout> | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let hasMeaningfulInteraction = false;
    let hasMinTimeElapsed = false;
    let triggered = false;

    function tryTrigger() {
      if (triggered) return;
      if (!hasMeaningfulInteraction) return;
      if (!hasMinTimeElapsed) return;

      triggered = true;
      showRandomCTAToast();

      // mark toast as shown in session to prevent duplicate toasts
      markToastAsShown();

      // save last shown timestamp to localStorage
      localStorage.setItem(
        CTA_TOAST_LAST_SHOWN_STORAGE_KEY,
        String(Date.now()),
      );

      // track event
      umamiTrackEvent("cta_toast_shown");
    }

    function handleIdle() {
      idleTimer = setTimeout(() => {
        tryTrigger();
      }, IDLE_TIME);
    }

    function resetIdle() {
      if (idleTimer) clearTimeout(idleTimer);
      handleIdle();
    }

    function handleMeaningfulInteraction() {
      hasMeaningfulInteraction = true;
    }

    // start tracking
    timeOnPageTimer = setTimeout(() => {
      // user has been here long enough, now wait for idle
      hasMinTimeElapsed = true;
      handleIdle();
    }, MIN_TIME_ON_PAGE);

    // interaction types
    window.addEventListener("pointerdown", handleMeaningfulInteraction);
    window.addEventListener("keydown", handleMeaningfulInteraction);
    // window.addEventListener("scroll", resetIdle, {
    //   passive: true,
    //   capture: true,
    // });
    window.addEventListener("pointerdown", resetIdle);
    window.addEventListener("keydown", resetIdle);

    return () => {
      if (timeOnPageTimer) clearTimeout(timeOnPageTimer);
      if (idleTimer) clearTimeout(idleTimer);

      window.removeEventListener("pointerdown", handleMeaningfulInteraction);
      window.removeEventListener("keydown", handleMeaningfulInteraction);
      // window.removeEventListener("scroll", resetIdle);
      window.removeEventListener("pointerdown", resetIdle);
      window.removeEventListener("keydown", resetIdle);
    };
  }, [isToastShownInSession, markToastAsShown]);
}
