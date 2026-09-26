// @vitest-environment happy-dom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  markChangelogAsSeen,
  shouldShowChangelogPopup,
} from "@/app/(main)/(app)/utils/changelog-seen-storage";
import {
  hasSeenWelcomePopup,
  markWelcomePopupSeen,
} from "@/app/(main)/(app)/utils/welcome-popup-seen-storage";
import type { ChangelogSummary } from "@/app/(main)/changelog/utils";

import { useChangelogUpdatePopup } from "../use-changelog-update-popup";

vi.mock("@/app/(main)/(app)/utils/welcome-popup-seen-storage", () => {
  return {
    hasSeenWelcomePopup: vi.fn(),
    markWelcomePopupSeen: vi.fn(),
  };
});

vi.mock("@/app/(main)/(app)/utils/changelog-seen-storage", () => {
  return {
    shouldShowChangelogPopup: vi.fn(),
    markChangelogAsSeen: vi.fn(),
  };
});

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
    canShowChangelog: boolean;
  }> = {},
) {
  return renderHook(() => {
    return useChangelogUpdatePopup({
      latestChangelog: null,
      isViewingSharedInvoice: false,
      canShowChangelog: true,
      ...overrides,
    });
  });
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
    expect(result.current.variant).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.variant).toBe("welcome");
    expect(markWelcomePopupSeen).toHaveBeenCalledTimes(1);
  });

  it("should not show changelog in same session after welcome was shown", () => {
    const { result, rerender } = renderHook(
      ({ latest }) => {
        return useChangelogUpdatePopup({
          latestChangelog: latest,
          isViewingSharedInvoice: false,
          canShowChangelog: true,
        });
      },
      { initialProps: { latest: null as ChangelogSummary | null } },
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.variant).toBe("welcome");

    vi.mocked(hasSeenWelcomePopup).mockReturnValue(true);

    act(() => {
      result.current.dismiss();
    });

    rerender({ latest: latestChangelog });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isOpen).toBe(false);
    expect(markChangelogAsSeen).not.toHaveBeenCalled();
  });

  it("should keep the welcome popup shown when props change while it is open", () => {
    const { result, rerender } = renderHook(
      ({ latest }) => {
        return useChangelogUpdatePopup({
          latestChangelog: latest,
          isViewingSharedInvoice: false,
          canShowChangelog: true,
        });
      },
      { initialProps: { latest: null as ChangelogSummary | null } },
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.variant).toBe("welcome");

    // Welcome was marked as seen on show, so a re-resolve would wrongly hide it
    vi.mocked(hasSeenWelcomePopup).mockReturnValue(true);

    rerender({ latest: latestChangelog });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.variant).toBe("welcome");
  });

  it("should show changelog popup on a return visit", () => {
    vi.mocked(hasSeenWelcomePopup).mockReturnValue(true);

    const { result } = renderChangelogPopupHook({ latestChangelog });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.variant).toBe("changelog");
    expect(markChangelogAsSeen).toHaveBeenCalledWith(latestChangelog.slug);
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

    vi.mocked(shouldShowChangelogPopup).mockImplementation((slug) => {
      return slug === newChangelog.slug;
    });

    const { result, rerender } = renderHook(
      ({ latest }) => {
        return useChangelogUpdatePopup({
          latestChangelog: latest,
          isViewingSharedInvoice: false,
          canShowChangelog: true,
        });
      },
      { initialProps: { latest: previousChangelog } },
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.variant).toBeNull();

    rerender({ latest: newChangelog });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.variant).toBe("changelog");
    expect(markChangelogAsSeen).toHaveBeenCalledWith(newChangelog.slug);
  });

  it("should mark popup as seen even when it is never interacted with", () => {
    vi.mocked(hasSeenWelcomePopup).mockReturnValue(true);

    const { unmount } = renderChangelogPopupHook({ latestChangelog });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    unmount();

    expect(markChangelogAsSeen).toHaveBeenCalledWith(latestChangelog.slug);
  });

  it("should not show popup when changelog was already seen", () => {
    vi.mocked(hasSeenWelcomePopup).mockReturnValue(true);
    vi.mocked(shouldShowChangelogPopup).mockReturnValue(false);

    const { result } = renderChangelogPopupHook({ latestChangelog });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.variant).toBeNull();
  });

  it("should not show changelog popup when it is disabled (mobile)", () => {
    vi.mocked(hasSeenWelcomePopup).mockReturnValue(true);

    const { result } = renderChangelogPopupHook({
      latestChangelog,
      canShowChangelog: false,
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.variant).toBeNull();
    // left unseen, so the next desktop visit still shows it
    expect(markChangelogAsSeen).not.toHaveBeenCalled();
  });

  it("should still show welcome popup when changelog is disabled (mobile)", () => {
    const { result } = renderChangelogPopupHook({
      latestChangelog,
      canShowChangelog: false,
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.variant).toBe("welcome");
  });

  it("should not show popup when viewing a shared invoice", () => {
    const { result } = renderChangelogPopupHook({
      isViewingSharedInvoice: true,
      latestChangelog,
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.variant).toBeNull();
  });

  it("should close popup when dismissed", () => {
    const { result } = renderChangelogPopupHook();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("should ignore dismiss before the popup is shown", () => {
    const { result } = renderChangelogPopupHook();

    // e.g. switching the mobile Edit/Preview tabs within the show delay
    act(() => {
      result.current.dismiss();
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(markWelcomePopupSeen).toHaveBeenCalledOnce();
    expect(result.current.isOpen).toBe(true);
    expect(result.current.variant).toBe("welcome");
  });
});
