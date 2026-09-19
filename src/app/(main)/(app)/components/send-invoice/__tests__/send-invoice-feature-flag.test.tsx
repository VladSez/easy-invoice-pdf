// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SendInvoiceProvider } from "@/components/send-invoice-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MOCK_INVOICE_DATA } from "@/utils/__tests__/data";

// Signed out, which is all this suite needs: it asserts whether the feature
// appears at all, not what it does once opened.
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn(), isLoaded: true, isSignedIn: false }),
  useUser: () => ({ user: null }),
  useClerk: () => ({ openSignIn: vi.fn() }),
}));

vi.mock("@clerk/nextjs/errors", () => ({
  isClerkAPIResponseError: () => false,
}));

import { SendInvoiceFeature } from "../send-invoice-dialog";

afterEach(cleanup);

function renderFeature(children: React.ReactNode) {
  return render(
    <TooltipProvider delayDuration={0}>{children}</TooltipProvider>,
  );
}

const feature = (
  <SendInvoiceFeature
    invoiceData={MOCK_INVOICE_DATA}
    qrCodeDataUrl="data:image/png;base64,"
  />
);

describe("Send invoice feature boundary", () => {
  it("renders no trigger while the flag is off", () => {
    const { container } = renderFeature(
      <SendInvoiceProvider enabled={false}>{feature}</SendInvoiceProvider>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders the trigger while the flag is on", () => {
    // The positive case guards against the suite passing because the feature
    // is broken rather than because it is hidden.
    renderFeature(<SendInvoiceProvider enabled>{feature}</SendInvoiceProvider>);

    expect(screen.getByTestId("send-invoice-button")).toBeDefined();
  });

  it("shows nothing when no flag value reached the tree", () => {
    // A subtree mounted without the provider — a page that never resolved the
    // flag — must not render a feature it cannot support.
    const { container } = renderFeature(feature);

    expect(container.innerHTML).toBe("");
  });
});
