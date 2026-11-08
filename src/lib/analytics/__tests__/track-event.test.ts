// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import { trackEvent } from "../track-event";

vi.mock("@sentry/nextjs", () => {
  return { captureException: vi.fn() };
});

describe("trackEvent", () => {
  afterEach(() => {
    delete window.umami;
    vi.restoreAllMocks();
  });

  it("reports a failing Umami call once, without recursing", () => {
    vi.spyOn(console, "error").mockImplementation(() => {
      // keep the expected Umami failures out of the test output
    });

    const track = vi.fn(() => {
      throw new Error("umami is down");
    });

    window.umami = { track };

    expect(() => {
      trackEvent({ event: "add_invoice_item" });
    }).not.toThrow();

    expect(track.mock.calls).toEqual([
      ["add_invoice_item", { data: undefined }],
      ["error_tracking_umami_event", { data: { error: "umami is down" } }],
    ]);
  });
});
