"use client";

import { useEffect, useRef } from "react";
import { showRandomCTAToast } from "../components/cta-toasts";
import { useCTAToast } from "../contexts/cta-toast-context";

const MIN_TIME_ON_PAGE = 7_000; // in ms
const IDLE_TIME = 5_000; // in ms

/** One interaction = one form update (PDF re-render) */
const MIN_INTERACTIONS = 3;

/**
 * Shows a CTA toast after the user has been idle, but only if they haven't
 * triggered a CTA-eligible action (PDF download or link generation) this session.
 *
 * - User stays on page Xs (MIN_TIME_ON_PAGE) -> we consider them "present".
 * - 3+ form updates -> we consider them engaged.
 * - Once they stop updating for X seconds (IDLE_TIME) -> if engaged, toast appears.
 */
export function useShowRandomCTAToastOnIdle() {
  const { hasTriggeredCTAAction, markCTAActionTriggered, interactionCount } =
    useCTAToast();

  const triggeredRef = useRef(false);
  const hasMinTimeElapsedRef = useRef(false);

  // Min time on page — runs once, independent of interactions
  useEffect(() => {
    if (hasTriggeredCTAAction || triggeredRef.current) return;

    const timer = setTimeout(() => {
      hasMinTimeElapsedRef.current = true;
    }, MIN_TIME_ON_PAGE);

    return () => clearTimeout(timer);
  }, [hasTriggeredCTAAction]);

  // Idle detection — resets on every form update (interactionCount change)
  useEffect(() => {
    // Skip if CTA already triggered this session or toast already shown
    if (hasTriggeredCTAAction || triggeredRef.current) return;
    // Skip if user hasn't engaged enough with the form yet
    if (interactionCount < MIN_INTERACTIONS) return;

    // Start idle timer — triggers toast after IDLE_TIME of inactivity
    const idleTimer = setTimeout(() => {
      // Verify both conditions still met: minimum time elapsed AND not already triggered
      if (!hasMinTimeElapsedRef.current || triggeredRef.current) return;

      // Mark as triggered to prevent duplicate toasts
      triggeredRef.current = true;

      // Show the toast and mark action as triggered
      showRandomCTAToast();
      markCTAActionTriggered();
    }, IDLE_TIME);

    return () => clearTimeout(idleTimer);
  }, [interactionCount, hasTriggeredCTAAction, markCTAActionTriggered]);
}
