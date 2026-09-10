// @vitest-environment happy-dom

import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIsDesktop } from "@/hooks/use-media-query";

import { BrowserSupportNotice } from "../browser-support-notice";

vi.mock("sonner", () => {
  return {
    toast: Object.assign(vi.fn(), { info: vi.fn(), warning: vi.fn() }),
  };
});

vi.mock("next-intl", () => {
  return {
    // `t("outdated.title")` -> `"outdated.title"`, so the assertions below stay
    // about which message is picked rather than about its English wording
    useTranslations: () => {
      return (key: string) => {
        return key;
      };
    },
  };
});

vi.mock("@/hooks/use-media-query", () => {
  return {
    useIsDesktop: vi.fn(() => {
      return true;
    }),
  };
});

import { toast } from "sonner";

const CHROME_141 =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const SAFARI_15 =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15";
const CHROME_49 =
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36";

function renderWithUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  });

  return render(<BrowserSupportNotice />);
}

describe("BrowserSupportNotice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsDesktop).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("says nothing on an up-to-date browser", () => {
    renderWithUserAgent(CHROME_141);

    expect(toast.info).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("nudges a browser that is more than three years old", () => {
    renderWithUserAgent(SAFARI_15);

    expect(toast.info).toHaveBeenCalledWith(
      "outdated.title",
      expect.objectContaining({
        id: "browser-support-toast",
        position: "bottom-right",
      }),
    );
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("warns harder below the `.browserslistrc` floor", () => {
    renderWithUserAgent(CHROME_49);

    expect(toast.warning).toHaveBeenCalledWith(
      "unsupported.title",
      expect.objectContaining({ id: "browser-support-toast" }),
    );
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("keeps the toast clear of the sticky bottom bar on mobile", () => {
    vi.mocked(useIsDesktop).mockReturnValue(false);

    renderWithUserAgent(SAFARI_15);

    expect(toast.info).toHaveBeenCalledWith(
      "outdated.title",
      expect.objectContaining({ position: "top-center" }),
    );
  });

  it("waits for the media query before opening the toast", () => {
    // `useIsDesktop` is `undefined` on the first commit; opening the toast then
    // would put it in the mobile position on a desktop
    vi.mocked(useIsDesktop).mockReturnValue(undefined);

    renderWithUserAgent(SAFARI_15);

    expect(toast.info).not.toHaveBeenCalled();
  });

  it("shows the toast only once even when the media query resolves late", () => {
    vi.mocked(useIsDesktop).mockReturnValue(true);

    const { rerender } = renderWithUserAgent(SAFARI_15);
    rerender(<BrowserSupportNotice />);

    expect(toast.info).toHaveBeenCalledTimes(1);
  });
});
