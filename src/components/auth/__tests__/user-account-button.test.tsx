// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SendInvoiceProvider } from "@/components/send-invoice-provider";

vi.mock("@clerk/nextjs", () => ({
  // Signed in, so the button has something to render when it is allowed to.
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => <button type="button">Account</button>,
}));

import { UserAccountButton } from "../user-account-button";

afterEach(cleanup);

describe("UserAccountButton", () => {
  it("renders nothing while the send feature is off", () => {
    // Accounts exist only alongside Send, so the header shows no account
    // control on a build where the feature is not available.
    const { container } = render(
      <SendInvoiceProvider enabled={false}>
        <UserAccountButton />
      </SendInvoiceProvider>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders the account button while the send feature is on", () => {
    render(
      <SendInvoiceProvider enabled>
        <UserAccountButton />
      </SendInvoiceProvider>,
    );

    expect(screen.getByRole("button", { name: "Account" })).toBeDefined();
  });

  it("shows nothing when no flag value reached the tree", () => {
    const { container } = render(<UserAccountButton />);

    expect(container.innerHTML).toBe("");
  });
});
