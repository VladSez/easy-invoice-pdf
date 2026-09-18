import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  sendInvoiceFlag: vi.fn(async () => false),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/flags", () => ({ sendInvoiceFlag: mocks.sendInvoiceFlag }));

// Only the gate is under test here; the callback itself is Clerk's.
vi.mock("../sso-callback.client", () => ({ SsoCallback: () => null }));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

async function renderPage() {
  const { default: SsoCallbackPage } = await import("../page");
  return SsoCallbackPage();
}

describe("SSO callback page", () => {
  it("renders while the flag is on", async () => {
    mocks.sendInvoiceFlag.mockResolvedValue(true);

    await expect(renderPage()).resolves.toBeDefined();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it("does not exist while the flag is off", async () => {
    // Nothing can link here without the feature, so the OAuth return route
    // should not answer at all.
    mocks.sendInvoiceFlag.mockResolvedValue(false);

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
