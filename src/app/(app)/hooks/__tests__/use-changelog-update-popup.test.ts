// @vitest-environment happy-dom

import type { ChangelogSummary } from "@/app/changelog/utils";
import { shouldShowChangelogPopup } from "@/app/(app)/utils/changelog-seen-storage";
import { hasSeenWelcomePopup } from "@/app/(app)/utils/welcome-popup-seen-storage";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChangelogUpdatePopup } from "../use-changelog-update-popup";

vi.mock("@/app/(app)/utils/welcome-popup-seen-storage", () => ({
  hasSeenWelcomePopup: vi.fn(),
}));

vi.mock("@/app/(app)/utils/changelog-seen-storage", () => ({
  shouldShowChangelogPopup: vi.fn(),
}));

const latestChangelog: ChangelogSummary = {
  slug: "v1-0-3",
  title: "Version 1.0.3",
  description: "Latest release",
  version: "1.0.3",
  date: "2026-07-01",
};

function renderChangelogPopupHook(
  overrides: Partial<{
    latestChangelog: ChangelogSummary | null;
    isViewingSharedInvoice: boolean;
    isMobile: boolean;
  }> = {},
) {
  return renderHook(() =>
    useChangelogUpdatePopup({
      latestChangelog: null,
      isViewingSharedInvoice: false,
      isMobile: false,
      ...overrides,
    }),
  );
}

describe("useChangelogUpdatePopup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(hasSeenWelcomePopup).mockReturnValue(false);
    vi.mocked(shouldShowChangelogPopup).mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should show welcome popup on first visit after delay", () => {
    const { result } = renderChangelogPopupHook();

    expect(result.current.isOpen).toBe(false);
    expect(result.current.variant).toBe(null);

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.variant).toBe("welcome");
    expect(result.current.latestChangelog).toBe(null);
  });

  it("should not show changelog in same session after welcome was shown", () => {
    const { result, rerender } = renderHook(
      ({ latest }) =>
        useChangelogUpdatePopup({
          latestChangelog: latest,
          isViewingSharedInvoice: false,
          isMobile: false,
        }),
      { initialProps: { latest: null as ChangelogSummary | null } },
    );

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(result.current.variant).toBe("welcome");

    vi.mocked(hasSeenWelcomePopup).mockReturnValue(true);

    act(() => {
      result.current.dismiss();
    });

    rerender({ latest: latestChangelog });

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.variant).toBe(null);
  });

  it("should show changelog popup on a return visit", () => {
    vi.mocked(hasSeenWelcomePopup).mockReturnValue(true);

    const { result } = renderChangelogPopupHook({ latestChangelog });

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.variant).toBe("changelog");
    expect(result.current.latestChangelog).toEqual(latestChangelog);
  });

  it("should show changelog popup when latest changelog slug changes", () => {
    vi.mocked(hasSeenWelcomePopup).mockReturnValue(true);

    const previousChangelog: ChangelogSummary = {
      ...latestChangelog,
      slug: "v1-0-2",
      title: "Version 1.0.2",
      version: "1.0.2",
    };

    const newChangelog: ChangelogSummary = {
      ...latestChangelog,
      slug: "v1-0-4",
      title: "Version 1.0.4",
      version: "1.0.4",
    };

    vi.mocked(shouldShowChangelogPopup).mockImplementation(
      (slug) => slug === newChangelog.slug,
    );

    const { result, rerender } = renderHook(
      ({ latest }) =>
        useChangelogUpdatePopup({
          latestChangelog: latest,
          isViewingSharedInvoice: false,
          isMobile: false,
        }),
      { initialProps: { latest: previousChangelog } },
    );

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.variant).toBe(null);

    rerender({ latest: newChangelog });

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.variant).toBe("changelog");
    expect(result.current.latestChangelog).toEqual(newChangelog);
  });

  it("should not show popup when changelog was already seen", () => {
    vi.mocked(hasSeenWelcomePopup).mockReturnValue(true);
    vi.mocked(shouldShowChangelogPopup).mockReturnValue(false);

    const { result } = renderChangelogPopupHook({ latestChangelog });

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.variant).toBe(null);
  });

  it("should not show popup on mobile", () => {
    const { result } = renderChangelogPopupHook({ isMobile: true });

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.variant).toBe(null);
  });

  it("should not show popup when viewing a shared invoice", () => {
    const { result } = renderChangelogPopupHook({
      isViewingSharedInvoice: true,
      latestChangelog,
    });

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.variant).toBe(null);
  });

  it("should close popup when dismissed", () => {
    const { result } = renderChangelogPopupHook();

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isOpen).toBe(false);
  });
});
