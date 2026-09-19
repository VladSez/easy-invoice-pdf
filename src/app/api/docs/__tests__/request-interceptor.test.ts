import { describe, expect, it, vi } from "vitest";

import {
  createRequestInterceptor,
  type SwaggerRequest,
} from "../request-interceptor";

const ORIGIN = "http://localhost:3000";

function interceptor(token: string | null = "fresh-token") {
  const getToken = vi.fn(async () => token);
  return {
    getToken,
    intercept: createRequestInterceptor({ getToken, getOrigin: () => ORIGIN }),
  };
}

describe("Swagger request interceptor", () => {
  it("attaches a freshly minted token to this app's API", async () => {
    const { intercept, getToken } = interceptor();

    const request = await intercept({
      url: `${ORIGIN}/api/v1/emails/send`,
      headers: { "Content-Type": "multipart/form-data" },
    });

    expect(request.headers).toEqual({
      "Content-Type": "multipart/form-data",
      Authorization: "Bearer fresh-token",
    });
    // Minted per request, so it cannot go stale between filling in the form
    // and pressing Execute.
    expect(getToken).toHaveBeenCalledTimes(1);
  });

  it("mints a new token for every request", async () => {
    const getToken = vi
      .fn<() => Promise<string | null>>()
      .mockResolvedValueOnce("token-1")
      .mockResolvedValueOnce("token-2");
    const intercept = createRequestInterceptor({
      getToken,
      getOrigin: () => ORIGIN,
    });

    const first = await intercept({ url: "/api/v1/mailboxes" });
    const second = await intercept({ url: "/api/v1/mailboxes" });

    expect(first.headers?.Authorization).toBe("Bearer token-1");
    expect(second.headers?.Authorization).toBe("Bearer token-2");
  });

  it("resolves a relative url against this origin", async () => {
    const { intercept } = interceptor();

    const request = await intercept({ url: "/api/v1/mailboxes" });

    expect(request.headers?.Authorization).toBe("Bearer fresh-token");
  });

  it("never sends the token to another origin", async () => {
    // An OpenAPI document can name external servers; a session token is a
    // bearer credential for this app alone.
    const { intercept, getToken } = interceptor();

    for (const url of [
      "https://evil.example.com/collect",
      "http://localhost:3001/api/v1/mailboxes",
      "https://localhost:3000/api/v1/mailboxes",
    ]) {
      const request = await intercept({ url });

      expect(request.headers?.Authorization).toBeUndefined();
    }

    // The token is not even requested for a foreign origin.
    expect(getToken).not.toHaveBeenCalled();
  });

  it("passes a request through when there is no session", async () => {
    const { intercept } = interceptor(null);

    const request = await intercept({
      url: "/api/v1/mailboxes",
      // A token typed into Swagger's Authorize dialog must survive.
      headers: { Authorization: "Bearer manually-entered" },
    });

    expect(request.headers?.Authorization).toBe("Bearer manually-entered");
  });

  it.each<SwaggerRequest>([{ url: "http://" }, {}])(
    "passes a request Swagger did not give a usable url through untouched (%o)",
    async (request) => {
      const { intercept, getToken } = interceptor();

      expect((await intercept(request)).headers?.Authorization).toBeUndefined();
      expect(getToken).not.toHaveBeenCalled();
    },
  );

  it("preserves the rest of the request", async () => {
    const { intercept } = interceptor();

    const body = new FormData();
    const request = await intercept({
      url: "/api/v1/emails/send",
      method: "POST",
      body,
    });

    expect(request).toMatchObject({
      url: "/api/v1/emails/send",
      method: "POST",
      body,
    });
  });
});
