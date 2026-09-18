"use client";

import { SignedIn, UserButton } from "@clerk/nextjs";

import { useSendInvoiceEnabled } from "@/components/send-invoice-provider";

/**
 * Clerk's standard account control; mailbox management stays in Send.
 *
 * Renders nothing at all while signed out. A wrapper element would still be a
 * flex item in the header row — zero width, but it claims the row's gap and
 * shifts the buttons beside it.
 *
 * Accounts only exist alongside Send, so the flag hides this too. The check
 * sits here rather than at each call site so a new one cannot reintroduce an
 * account control for a feature the user does not have.
 */
export function UserAccountButton() {
  const isSendInvoiceEnabled = useSendInvoiceEnabled();

  if (!isSendInvoiceEnabled) {
    return null;
  }

  return (
    <SignedIn>
      <UserButton />
    </SignedIn>
  );
}
