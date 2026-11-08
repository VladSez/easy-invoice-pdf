import type { CaptureResult } from "posthog-js";
import { describe, expect, it } from "vitest";

import { scrubPostHogEvent } from "../scrub-posthog-event";

const INVOICE = "N4IgtghgLg-zp+M$8bK";

function buildEvent(overrides: Partial<CaptureResult>): CaptureResult {
  return {
    uuid: "0190",
    event: "$pageview",
    properties: {},
    ...overrides,
  };
}

describe("scrubPostHogEvent", () => {
  it("redacts the invoice in the page url and referrer", () => {
    const event = scrubPostHogEvent(
      buildEvent({
        properties: {
          $current_url: `https://easyinvoicepdf.com/?data=${INVOICE}`,
          $referrer: `https://easyinvoicepdf.com/stripe-template?data=${INVOICE}#top`,
          $pathname: "/",
        },
      }),
    );

    expect(event.properties).toEqual({
      $current_url: "https://easyinvoicepdf.com/?data=[Filtered]",
      $referrer:
        "https://easyinvoicepdf.com/stripe-template?data=[Filtered]#top",
      $pathname: "/",
    });
  });

  it("keeps the other query params", () => {
    const event = scrubPostHogEvent(
      buildEvent({
        properties: {
          $current_url: `https://easyinvoicepdf.com/?utm_source=x&data=${INVOICE}&ref=y`,
        },
      }),
    );

    expect(event.properties.$current_url).toBe(
      "https://easyinvoicepdf.com/?utm_source=x&data=[Filtered]&ref=y",
    );
  });

  it("redacts initial-url person properties", () => {
    const event = scrubPostHogEvent(
      buildEvent({
        $set_once: {
          $initial_current_url: `https://easyinvoicepdf.com/?data=${INVOICE}`,
        },
        $set: { $current_url: `https://easyinvoicepdf.com/?data=${INVOICE}` },
      }),
    );

    expect(event.$set_once?.$initial_current_url).toBe(
      "https://easyinvoicepdf.com/?data=[Filtered]",
    );
    expect(event.$set?.$current_url).toBe(
      "https://easyinvoicepdf.com/?data=[Filtered]",
    );
  });

  it("redacts a link inside autocapture's element chain", () => {
    const event = scrubPostHogEvent(
      buildEvent({
        event: "$autocapture",
        properties: {
          $elements_chain: `a:attr__href="/?data=${INVOICE}"nth-child="1";div.share`,
        },
      }),
    );

    expect(event.properties.$elements_chain).toBe(
      'a:attr__href="/?data=[Filtered]"nth-child="1";div.share',
    );
  });

  it("redacts urls nested in arrays and objects", () => {
    const event = scrubPostHogEvent(
      buildEvent({
        event: "$web_vitals",
        properties: {
          $web_vitals_LCP_event: {
            $current_url: `/?data=${INVOICE}`,
            value: 1200,
          },
          urls: [`/?data=${INVOICE}`],
        },
      }),
    );

    expect(event.properties).toEqual({
      $web_vitals_LCP_event: { $current_url: "/?data=[Filtered]", value: 1200 },
      urls: ["/?data=[Filtered]"],
    });
  });

  it("redacts urls used as object keys, as in heatmap data", () => {
    const event = scrubPostHogEvent(
      buildEvent({
        event: "$$heatmap",
        properties: {
          $heatmap_data: {
            [`https://easyinvoicepdf.com/?data=${INVOICE}`]: [
              { x: 121, y: 393 },
            ],
          },
        },
      }),
    );

    expect(event.properties.$heatmap_data).toEqual({
      "https://easyinvoicepdf.com/?data=[Filtered]": [{ x: 121, y: 393 }],
    });
  });

  it("leaves params that only end in `data` alone", () => {
    const event = scrubPostHogEvent(
      buildEvent({ properties: { $current_url: "/?metadata=1&userdata=2" } }),
    );

    expect(event.properties.$current_url).toBe("/?metadata=1&userdata=2");
  });
});
