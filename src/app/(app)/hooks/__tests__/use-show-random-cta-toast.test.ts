// @vitest-environment happy-dom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { showRandomCTAToast } from "../../components/cta-toasts";
import { useCTAToast } from "../../contexts/cta-toast-context";
import { useShowRandomCTAToastOnIdle } from "../use-show-random-cta-toast";

vi.mock("../../components/cta-toasts", () => {
  return {
    showRandomCTAToast: vi.fn(),
  };
});

vi.mock("../../contexts/cta-toast-context", () => {
  return {
    useCTAToast: vi.fn(),
  };
});

const MIN_TIME_ON_PAGE = 7000;
const IDLE_TIME = 5000;

interface CTAToastState {
  hasTriggeredCTAAction: boolean;
  interactionCount: number;
}

function renderIdleToastHook(initialState: Partial<CTAToastState> = {}) {
  const markCTAActionTriggered = vi.fn();
  const state: CTAToastState = {
    hasTriggeredCTAAction: false,
    interactionCount: 0,
    ...initialState,
  };

  vi.mocked(useCTAToast).mockImplementation(() => {
    return {
      hasTriggeredCTAAction: state.hasTriggeredCTAAction,
      markCTAActionTriggered,
      interactionCount: state.interactionCount,
      incrementInteractionCount: vi.fn(),
    };
  });

  const hook = renderHook(() => {
    return useShowRandomCTAToastOnIdle();
  });

  return {
    ...hook,
    markCTAActionTriggered,
    setInteractionCount(count: number) {
      state.interactionCount = count;
      hook.rerender();
    },
    setHasTriggeredCTAAction(value: boolean) {
      state.hasTriggeredCTAAction = value;
      hook.rerender();
    },
  };
}

describe("useShowRandomCTAToastOnIdle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should show toast after min time on page, enough interactions, and idle period", () => {
    const { markCTAActionTriggered, setInteractionCount } =
      renderIdleToastHook();

    act(() => {
      vi.advanceTimersByTime(MIN_TIME_ON_PAGE);
    });

    setInteractionCount(3);

    act(() => {
      vi.advanceTimersByTime(IDLE_TIME);
    });

    expect(showRandomCTAToast).toHaveBeenCalledTimes(1);
    expect(markCTAActionTriggered).toHaveBeenCalledTimes(1);
  });

  it("should not show toast when user has fewer than 3 interactions", () => {
    const { setInteractionCount } = renderIdleToastHook();

    act(() => {
      vi.advanceTimersByTime(MIN_TIME_ON_PAGE);
    });

    setInteractionCount(2);

    act(() => {
      vi.advanceTimersByTime(IDLE_TIME);
    });

    expect(showRandomCTAToast).not.toHaveBeenCalled();
  });

  it("should not show toast when CTA action was already triggered this session", () => {
    renderIdleToastHook({
      hasTriggeredCTAAction: true,
      interactionCount: 3,
    });

    act(() => {
      vi.advanceTimersByTime(MIN_TIME_ON_PAGE + IDLE_TIME);
    });

    expect(showRandomCTAToast).not.toHaveBeenCalled();
  });

  it("should not show toast when idle period ends before min time on page elapses", () => {
    const { setInteractionCount } = renderIdleToastHook();

    setInteractionCount(3);

    act(() => {
      vi.advanceTimersByTime(IDLE_TIME);
    });

    expect(showRandomCTAToast).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(MIN_TIME_ON_PAGE - IDLE_TIME);
    });

    expect(showRandomCTAToast).not.toHaveBeenCalled();
  });

  it("should show toast after min time elapses if user becomes idle again", () => {
    const { markCTAActionTriggered, setInteractionCount } =
      renderIdleToastHook();

    setInteractionCount(3);

    act(() => {
      vi.advanceTimersByTime(IDLE_TIME);
    });

    expect(showRandomCTAToast).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(MIN_TIME_ON_PAGE - IDLE_TIME);
    });

    setInteractionCount(4);

    act(() => {
      vi.advanceTimersByTime(IDLE_TIME);
    });

    expect(showRandomCTAToast).toHaveBeenCalledTimes(1);
    expect(markCTAActionTriggered).toHaveBeenCalledTimes(1);
  });

  it("should reset idle timer when interaction count changes", () => {
    const { setInteractionCount } = renderIdleToastHook();

    act(() => {
      vi.advanceTimersByTime(MIN_TIME_ON_PAGE);
    });

    setInteractionCount(3);

    act(() => {
      vi.advanceTimersByTime(IDLE_TIME - 1000);
    });

    setInteractionCount(4);

    act(() => {
      vi.advanceTimersByTime(IDLE_TIME - 1000);
    });

    expect(showRandomCTAToast).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(showRandomCTAToast).toHaveBeenCalledTimes(1);
  });

  it("should only show toast once", () => {
    const { setInteractionCount } = renderIdleToastHook();

    act(() => {
      vi.advanceTimersByTime(MIN_TIME_ON_PAGE);
    });

    setInteractionCount(3);

    act(() => {
      vi.advanceTimersByTime(IDLE_TIME);
    });

    expect(showRandomCTAToast).toHaveBeenCalledTimes(1);

    setInteractionCount(5);

    act(() => {
      vi.advanceTimersByTime(IDLE_TIME);
    });

    expect(showRandomCTAToast).toHaveBeenCalledTimes(1);
  });
});
