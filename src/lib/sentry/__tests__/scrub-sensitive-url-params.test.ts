import type { ErrorEvent, Event } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import {
  scrubSensitiveUrlParamsBeforeBreadcrumb,
  scrubSensitiveUrlParamsFromEvent,
  scrubUrl,
} from "../scrub-sensitive-url-params";

describe("scrubUrl", () => {
  it("redacts the `data` param in an absolute url", () => {
    expect(scrubUrl("https://easyinvoicepdf.com/?data=N4IgtghgLg")).toBe(
      "https://easyinvoicepdf.com/?data=[Filtered]",
    );
  });

  it("redacts the `data` param in a relative url", () => {
    expect(scrubUrl("/en?data=N4IgtghgLg")).toBe("/en?data=[Filtered]");
  });

  it("keeps the other params and their order", () => {
    expect(scrubUrl("/?locale=pl&data=N4IgtghgLg&currency=EUR")).toBe(
      "/?locale=pl&data=[Filtered]&currency=EUR",
    );
  });

  it("keeps the hash", () => {
    expect(scrubUrl("/?data=N4IgtghgLg#invoice")).toBe(
      "/?data=[Filtered]#invoice",
    );
    expect(scrubUrl("/?locale=pl&data=N4IgtghgLg#invoice")).toBe(
      "/?locale=pl&data=[Filtered]#invoice",
    );
  });

  it("redacts an empty `data` param (corrupted invoice url)", () => {
    expect(scrubUrl("https://easyinvoicepdf.com/?data=")).toBe(
      "https://easyinvoicepdf.com/?data=[Filtered]",
    );
  });

  it("redacts every occurrence of the `data` param", () => {
    expect(scrubUrl("/?data=one&locale=pl&data=two")).toBe(
      "/?data=[Filtered]&locale=pl",
    );
  });

  it("leaves urls without sensitive params untouched", () => {
    expect(scrubUrl("https://easyinvoicepdf.com/about")).toBe(
      "https://easyinvoicepdf.com/about",
    );
    expect(scrubUrl("/api/generate-invoice?foo=a%20b&bar=%2B")).toBe(
      "/api/generate-invoice?foo=a%20b&bar=%2B",
    );
    expect(scrubUrl("")).toBe("");
  });

  it("does not treat a `?` inside the hash as a query string", () => {
    expect(scrubUrl("/en#section?data=N4IgtghgLg")).toBe(
      "/en#section?data=N4IgtghgLg",
    );
  });

  it("never leaks the invoice payload, whatever the url shape", () => {
    for (const url of [
      "https://easyinvoicepdf.com/?data=N4IgtghgLg",
      "/en?locale=pl&data=N4IgtghgLg#invoice",
      "/?data=N4IgtghgLg&data=N4IgtghgLg",
    ]) {
      expect(scrubUrl(url)).not.toContain("N4IgtghgLg");
    }
  });

  it("does not touch params that merely contain `data`", () => {
    expect(scrubUrl("/?metadata=keep&datax=keep")).toBe(
      "/?metadata=keep&datax=keep",
    );
  });
});

describe("scrubSensitiveUrlParamsFromEvent (errors)", () => {
  it("scrubs the request url, query string and referrer", () => {
    const event = {
      request: {
        url: "https://easyinvoicepdf.com/?data=N4IgtghgLg&locale=pl",
        query_string: "data=N4IgtghgLg&locale=pl",
        headers: {
          Referer: "https://easyinvoicepdf.com/?data=N4IgtghgLg",
          "User-Agent": "Mozilla/5.0",
        },
      },
    } as unknown as ErrorEvent;

    const scrubbed = scrubSensitiveUrlParamsFromEvent(event);

    expect(scrubbed.request?.url).toBe(
      "https://easyinvoicepdf.com/?data=[Filtered]&locale=pl",
    );
    expect(scrubbed.request?.query_string).toBe("data=[Filtered]&locale=pl");
    expect(scrubbed.request?.headers?.Referer).toBe(
      "https://easyinvoicepdf.com/?data=[Filtered]",
    );
    expect(scrubbed.request?.headers?.["User-Agent"]).toBe("Mozilla/5.0");
  });

  it("scrubs navigation and fetch breadcrumbs", () => {
    const event = {
      breadcrumbs: [
        {
          category: "navigation",
          data: { from: "/?data=N4IgtghgLg", to: "/en?data=N4IgtghgLg" },
        },
        {
          category: "fetch",
          data: {
            url: "https://easyinvoicepdf.com/api/generate-invoice?data=N4IgtghgLg",
            status_code: 500,
          },
        },
      ],
    } as unknown as ErrorEvent;

    const scrubbed = scrubSensitiveUrlParamsFromEvent(event);

    expect(scrubbed.breadcrumbs?.[0]?.data).toEqual({
      from: "/?data=[Filtered]",
      to: "/en?data=[Filtered]",
    });
    expect(scrubbed.breadcrumbs?.[1]?.data).toEqual({
      url: "https://easyinvoicepdf.com/api/generate-invoice?data=[Filtered]",
      status_code: 500,
    });
  });

  it("returns events without request data unchanged", () => {
    const event = { message: "boom" } as unknown as ErrorEvent;

    expect(scrubSensitiveUrlParamsFromEvent(event)).toEqual({
      message: "boom",
    });
  });
});

describe("scrubSensitiveUrlParamsFromEvent (transactions)", () => {
  it("scrubs trace context and span attributes", () => {
    const event = {
      contexts: {
        trace: {
          data: {
            "http.url": "https://easyinvoicepdf.com/?data=N4IgtghgLg",
            "url.query": "data=N4IgtghgLg&locale=pl",
          },
        },
      },
      spans: [
        {
          data: {
            "http.url": "https://easyinvoicepdf.com/?data=N4IgtghgLg",
            "http.method": "GET",
          },
        },
      ],
    } as unknown as Event;

    const scrubbed = scrubSensitiveUrlParamsFromEvent(event);

    expect(scrubbed.contexts?.trace?.data).toEqual({
      "http.url": "https://easyinvoicepdf.com/?data=[Filtered]",
      "url.query": "data=[Filtered]&locale=pl",
    });
    expect(scrubbed.spans?.[0]?.data).toEqual({
      "http.url": "https://easyinvoicepdf.com/?data=[Filtered]",
      "http.method": "GET",
    });
  });
});

describe("scrubSensitiveUrlParamsBeforeBreadcrumb", () => {
  it("scrubs the breadcrumb url as it is recorded", () => {
    const breadcrumb = scrubSensitiveUrlParamsBeforeBreadcrumb({
      category: "navigation",
      data: { from: "/", to: "/?data=N4IgtghgLg" },
    });

    expect(breadcrumb.data).toEqual({ from: "/", to: "/?data=[Filtered]" });
  });

  it("keeps breadcrumbs without data", () => {
    const breadcrumb = scrubSensitiveUrlParamsBeforeBreadcrumb({
      category: "console",
      message: "hello",
    });

    expect(breadcrumb).toEqual({ category: "console", message: "hello" });
  });
});
