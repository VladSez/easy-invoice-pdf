"use client";

import { isLocalStorageAvailable } from "@/lib/check-local-storage";

const WELCOME_POPUP_SEEN_STORAGE_KEY = "EASY_INVOICE_WELCOME_POPUP_SEEN";

const WELCOME_POPUP_SEEN_VALUE = "v1";

export function hasSeenWelcomePopup() {
  if (!isLocalStorageAvailable) {
    return false;
  }

  try {
    return (
      localStorage.getItem(WELCOME_POPUP_SEEN_STORAGE_KEY) ===
      WELCOME_POPUP_SEEN_VALUE
    );
  } catch {
    return false;
  }
}

export function markWelcomePopupSeen() {
  if (!isLocalStorageAvailable) {
    return;
  }

  try {
    localStorage.setItem(
      WELCOME_POPUP_SEEN_STORAGE_KEY,
      WELCOME_POPUP_SEEN_VALUE,
    );
  } catch {}
}
