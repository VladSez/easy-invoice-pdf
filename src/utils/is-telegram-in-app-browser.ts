"use client";

export function isTelegramInAppBrowser() {
  if (typeof window === "undefined") {
    return false;
  }

  // Android
  if ("TelegramWebview" in window) {
    return true;
  }

  // iOS
  if (
    "TelegramWebviewProxy" in window &&
    "TelegramWebviewProxyProto" in window
  ) {
    return true;
  }

  return false;
}
