import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendInvoiceFlag: vi.fn(async () => false),
}));

vi.mock("@/flags", () => ({ sendInvoiceFlag: mocks.sendInvoiceFlag }));

// The gate is what's under test; Clerk has no credentials here, and the app's
// own behaviour is covered by the suites in src/server/api/__tests__.
vi.mock("@clerk/hono", () => ({
  clerkMiddleware: () => async (_context: unknown, next: () => Promise<void>) =>
    next(),
  getAuth: () => ({ userId: null }),
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("Send API feature boundary", () => {
  it("returns 404 while the flag is off", async () => {
    mocks.sendInvoiceFlag.mockResolvedValue(false);

    const route = await import("../[[...route]]/route");
    const [getResponse, deleteResponse] = await Promise.all([
      route.GET(new Request("http://localhost/api/health")),
      route.DELETE(
        new Request("http://localhost/api/v1/mailboxes/eac_1", {
          method: "DELETE",
        }),
      ),
    ]);

    expect(getResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });

  it("serves the API while the flag is on", async () => {
    // Guards against the 404s above coming from a broken route rather than
    // from the flag.
    mocks.sendInvoiceFlag.mockResolvedValue(true);

    const route = await import("../[[...route]]/route");
    const response = await route.GET(
      new Request("http://localhost/api/health"),
    );

    expect(response.status).toBe(200);
  });
});
