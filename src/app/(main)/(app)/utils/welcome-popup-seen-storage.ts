"use client";

import {
  getAppStorageItem,
  setAppStorageItem,
} from "@/app/(main)/(app)/utils/app-local-storage";
import {
  WELCOME_POPUP_SEEN_STORAGE_KEY,
  WELCOME_POPUP_SEEN_VALUE,
} from "@/app/schema";

export function hasSeenWelcomePopup() {
  return (
    getAppStorageItem(WELCOME_POPUP_SEEN_STORAGE_KEY) ===
    WELCOME_POPUP_SEEN_VALUE
  );
}

export function markWelcomePopupSeen() {
  setAppStorageItem({
    key: WELCOME_POPUP_SEEN_STORAGE_KEY,
    value: WELCOME_POPUP_SEEN_VALUE,
  });
}
