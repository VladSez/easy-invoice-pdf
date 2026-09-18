"use client";

import { Button } from "@/components/ui/button";
import {
  MAILBOX_PROVIDER_IDS,
  MAILBOX_PROVIDERS,
  type Mailbox,
  type MailboxProvider,
} from "@/lib/mailbox/mailbox-types";
import { cn } from "@/lib/utils";

import { ConnectMailboxButton } from "./connect-mailbox-button";
import type { MailboxOperation } from "./use-mailboxes";

/**
 * The state before any mailbox can send. It shows nothing but the connect
 * choice: no recipient fields, no invoice summary and no send button exist
 * until there is a usable mailbox.
 *
 * `awaitingPermission` covers accounts Clerk already linked — usually the one
 * the user signed in with — that have not granted send permission. Connecting
 * that provider reauthorizes the existing account rather than adding a second
 * identity.
 *
 * `missedSendPermission` is the provider the browser just returned from with
 * nothing granted. That is the one case where the user does not need to be
 * told the state of their mailbox — they need to be told which control they
 * missed — so it replaces the wording entirely.
 */
export function ConnectMailboxView({
  awaitingPermission,
  missedSendPermission,
  onConnect,
  onCancel,
  operation,
}: {
  awaitingPermission: Mailbox[];
  missedSendPermission?: MailboxProvider;
  onConnect: (provider: MailboxProvider) => void;
  onCancel: () => void;
  operation: MailboxOperation | undefined;
}) {
  const linkedAccount = awaitingPermission[0];
  const needsAttention = Boolean(missedSendPermission ?? linkedAccount);

  return (
    <div className="px-5 py-6">
      <h3
        className={cn(
          "text-sm font-semibold text-slate-900",
          needsAttention ? "text-amber-600" : "",
        )}
      >
        {missedSendPermission
          ? "Send permission wasn't granted"
          : linkedAccount
            ? "Reconnect your mailbox"
            : "Connect a mailbox"}
      </h3>
      <p
        className={cn(
          "mt-1 text-sm text-slate-600",
          needsAttention ? "text-amber-600" : "",
        )}
      >
        {missedSendPermission
          ? getMissedPermissionMessage(missedSendPermission)
          : linkedAccount
            ? `EasyInvoicePDF no longer has permission to send from ${linkedAccount.email}. Reconnect it to continue.`
            : "Send invoices directly from your own email account."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {MAILBOX_PROVIDER_IDS.map((provider) => (
          <ConnectMailboxButton
            key={provider}
            provider={provider}
            verb={
              awaitingPermission.some(
                (mailbox) => mailbox.provider === provider,
              )
                ? "Reconnect"
                : "Connect"
            }
            onConnect={onConnect}
            isConnecting={
              operation?.type === "connect" && operation.provider === provider
            }
            disabled={operation !== undefined}
          />
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        EasyInvoicePDF will request permission only to send email from the
        account you connect. You can revoke access at any time from your
        provider.
      </p>

      <div className="mt-6 flex justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/**
 * Names the control the user has to grant, in the provider's own words.
 *
 * Google presents the send scope as a checkbox that starts unchecked, so the
 * instruction is to tick it. Microsoft asks for the whole permission set at
 * once, so there is nothing to tick and the instruction is to accept.
 */
function getMissedPermissionMessage(provider: MailboxProvider) {
  const { label } = MAILBOX_PROVIDERS[provider];

  return provider === "gmail"
    ? `${label} leaves “Send email on your behalf” unchecked. Tick it on Google's screen to send invoices from your mailbox.`
    : `${label} needs the “Send mail as you” permission accepted to send invoices from your mailbox.`;
}
