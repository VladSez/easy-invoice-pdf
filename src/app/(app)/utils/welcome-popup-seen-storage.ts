"use client";

import {
  getAppStorageItem,
  setAppStorageItem,
} from "@/app/(app)/utils/app-local-storage";
import { WELCOME_POPUP_SEEN_STORAGE_KEY } from "@/app/schema";

const WELCOME_POPUP_SEEN_VALUE = "v1";

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
