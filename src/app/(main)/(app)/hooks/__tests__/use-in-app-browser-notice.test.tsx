// @vitest-environment happy-dom

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DeviceContextProvider } from "@/contexts/device-context";
import type { InAppInfo } from "@/lib/check-device.server";
import { isTelegramInAppBrowser } from "@/utils/is-telegram-in-app-browser";

import { useInAppBrowserNotice } from "../use-in-app-browser-notice";

vi.mock("sonner", () => {
  return {
    toast: Object.assign(vi.fn(), { info: vi.fn() }),
  };
});

vi.mock("@/utils/is-telegram-in-app-browser", () => {
  return {
    isTelegramInAppBrowser: vi.fn(() => {
      return false;
    }),
  };
});

import { toast } from "sonner";

function renderInAppBrowserNotice({
  inAppInfo = { isInApp: false, name: null },
  isDesktop = true,
}: { inAppInfo?: InAppInfo; isDesktop?: boolean } = {}) {
  return renderHook(
    () => {
      return useInAppBrowserNotice();
    },
    {
      wrapper: ({ children }) => {
        return (
          <DeviceContextProvider
            isDesktop={isDesktop}
            isAndroid={false}
            isMobile={!isDesktop}
            inAppInfo={inAppInfo}
          >
            {children}
          </DeviceContextProvider>
        );
      },
    },
  );
}

describe("useInAppBrowserNotice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isTelegramInAppBrowser).mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should warn the user when the page runs inside an in-app browser", () => {
    renderInAppBrowserNotice({
      inAppInfo: { isInApp: true, name: "Facebook" },
    });

    expect(toast.info).toHaveBeenCalledWith(
      "In-App Browser Detected",
      expect.objectContaining({
        id: "in-app-browser-toast",
        position: "bottom-right",
      }),
    );
  });

  it("should warn the user inside the Telegram preview browser", () => {
    vi.mocked(isTelegramInAppBrowser).mockReturnValue(true);

    renderInAppBrowserNotice({ isDesktop: false });

    expect(toast.info).toHaveBeenCalledWith(
      "In-App Browser Detected",
      expect.objectContaining({
        id: "in-app-browser-toast",
        // mobile gets the toast out of the way of the sticky download bar
        position: "top-center",
      }),
    );
  });

  it("should warn only once, no matter how often the page re-renders", () => {
    const { rerender } = renderInAppBrowserNotice({
      inAppInfo: { isInApp: true, name: "Facebook" },
    });

    rerender();
    rerender();

    expect(toast.info).toHaveBeenCalledTimes(1);
  });

  it("should stay quiet in a normal browser", () => {
    renderInAppBrowserNotice();

    expect(toast.info).not.toHaveBeenCalled();
  });
});
