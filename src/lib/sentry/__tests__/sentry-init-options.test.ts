import { describe, expect, it } from "vitest";

import { isSentryEnabled } from "../sentry-init-options";

describe("isSentryEnabled", () => {
  it("reports when the flag is opted in", () => {
    expect(isSentryEnabled({ enabledFlag: "true", ci: undefined })).toBe(true);
  });

  it("stays silent when the flag is not opted in", () => {
    expect(isSentryEnabled({ enabledFlag: undefined, ci: undefined })).toBe(
      false,
    );

    expect(isSentryEnabled({ enabledFlag: "false", ci: undefined })).toBe(
      false,
    );
  });

  it("stays silent in CI", () => {
    expect(isSentryEnabled({ enabledFlag: "true", ci: "true" })).toBe(false);
  });

  it("reports when `ci` is omitted, as the browser does", () => {
    expect(isSentryEnabled({ enabledFlag: "true" })).toBe(true);
  });
});
