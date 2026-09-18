import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  sendInvoiceFlag: vi.fn(async () => true),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/flags", () => ({ sendInvoiceFlag: mocks.sendInvoiceFlag }));

// The page only needs to be gated here; the component itself pulls in Clerk
// and Swagger UI, which belong to the browser.
vi.mock("../swagger-docs", () => ({ SwaggerDocs: () => null }));
vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

async function renderPage() {
  const { default: ApiDocsPage } = await import("../page");
  return ApiDocsPage();
}

describe("API docs page", () => {
  it("renders in development with the send feature enabled", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mocks.sendInvoiceFlag.mockResolvedValue(true);

    await expect(renderPage()).resolves.toBeDefined();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it("is not served on a deployment", async () => {
    // Vercel builds and runs with NODE_ENV=production everywhere, so no
    // preview or production deployment exposes the explorer.
    vi.stubEnv("NODE_ENV", "production");
    mocks.sendInvoiceFlag.mockResolvedValue(true);

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("is not served while the send feature is disabled", async () => {
    // Without the feature there is no API to explore.
    vi.stubEnv("NODE_ENV", "development");
    mocks.sendInvoiceFlag.mockResolvedValue(false);

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
