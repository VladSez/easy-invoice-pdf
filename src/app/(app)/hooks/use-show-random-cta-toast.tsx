"use client";

import { useEffect } from "react";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { showRandomCTAToast } from "../components/cta-toasts";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

const STORAGE_KEY = "EASY_INVOICE_CTA_LAST_SHOWN_AT";
const COOLDOWN_DAYS = 7;
const MIN_TIME_ON_PAGE = 10_000; // in milliseconds
const IDLE_TIME = 3_000; // in milliseconds

/**
 * This hook is used to show a CTA toast after a certain number of interactions with the page.
 *
 * - User stays on page 10s → we consider them “present”.
 * - Any real interaction (scroll, type, click) → we mark them engaged.
 * - Once they stop interacting for 3s → toast appears.
 */
export function useShowRandomCTAToast() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const last = localStorage.getItem(STORAGE_KEY);

    // Check if the last time the CTA toast was shown was less than 7 days ago
    const isWithinCooldownPeriod =
      dayjs().diff(dayjs(Number(last))) <
      dayjs.duration(COOLDOWN_DAYS, "day").asMilliseconds();

    // If the last time the CTA toast was shown was less than 7 days ago, skip showing the toast
    if (last && isWithinCooldownPeriod) {
      umamiTrackEvent("cta_toast_skipped_recently");
      return;
    }

    let timeOnPageTimer: ReturnType<typeof setTimeout> | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let hasMeaningfulInteraction = false;
    let triggered = false;

    function tryTrigger() {
      if (triggered) return;
      if (!hasMeaningfulInteraction) return;

      triggered = true;
      showRandomCTAToast();

      // save last shown timestamp to localStorage
      localStorage.setItem(STORAGE_KEY, String(Date.now()));

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
      handleIdle();
    }, MIN_TIME_ON_PAGE);

    // interaction types
    window.addEventListener("pointerdown", handleMeaningfulInteraction);
    window.addEventListener("keydown", handleMeaningfulInteraction);
    window.addEventListener("scroll", resetIdle, { passive: true });
    window.addEventListener("pointerdown", resetIdle);
    window.addEventListener("keydown", resetIdle);

    return () => {
      if (timeOnPageTimer) clearTimeout(timeOnPageTimer);
      if (idleTimer) clearTimeout(idleTimer);

      window.removeEventListener("pointerdown", handleMeaningfulInteraction);
      window.removeEventListener("keydown", handleMeaningfulInteraction);
      window.removeEventListener("scroll", resetIdle);
      window.removeEventListener("pointerdown", resetIdle);
      window.removeEventListener("keydown", resetIdle);
    };
  }, []);
}
