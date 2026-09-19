"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MAILBOX_PROVIDER_IDS,
  type Mailbox,
  type MailboxProvider,
} from "@/lib/mailbox/mailbox-types";

import { ConnectMailboxButton } from "./connect-mailbox-button";
import { MailboxRow } from "./mailbox-row";
import type { MailboxOperation } from "./use-mailboxes";

/**
 * Mailbox administration, kept out of the compose screen so the main task
 * stays "send the invoice". Opens on top of the send dialog, which keeps the
 * email draft mounted and untouched.
 */
export function ManageMailboxesDialog({
  open,
  onOpenChange,
  mailboxes,
  operation,
  error,
  onConnect,
  onReconnect,
  onDisconnect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mailboxes: Mailbox[];
  operation: MailboxOperation | undefined;
  error: string | undefined;
  onConnect: (provider: MailboxProvider) => void;
  onReconnect: (mailbox: Mailbox) => void;
  onDisconnect: (mailbox: Mailbox) => void;
}) {
  // Clerk allows one linked account per provider, so a provider is offered
  // only while it has no mailbox yet.
  const connectableProviders = MAILBOX_PROVIDER_IDS.filter(
    (provider) => !mailboxes.some((mailbox) => mailbox.provider === provider),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[480px]">
        <DialogHeader className="px-5 pb-3 pt-5 text-left">
          <DialogTitle className="text-base">Mailboxes</DialogTitle>
          <DialogDescription>
            Connect an account to send invoices from your own address.
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-rounded overflow-auto px-5 pb-5">
          {error ? (
            <div
              role="alert"
              className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          ) : null}

          <div className="rounded-lg border border-gray-200">
            {mailboxes.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">
                No mailboxes connected yet — pick a provider below.
              </p>
            ) : (
              <div className="">
                {mailboxes.map((mailbox) => {
                  return (
                    <MailboxRow
                      key={mailbox.id}
                      mailbox={mailbox}
                      operation={operation}
                      onReconnect={onReconnect}
                      onDisconnect={onDisconnect}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {connectableProviders.length > 0 ? (
            <div className="mt-3.5 flex flex-wrap gap-2">
              {connectableProviders.map((provider) => (
                <ConnectMailboxButton
                  key={provider}
                  provider={provider}
                  onConnect={onConnect}
                  isConnecting={
                    operation?.type === "connect" &&
                    operation.provider === provider
                  }
                  disabled={operation !== undefined}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 border-t border-gray-200 bg-slate-50/70 px-5 py-3">
          <span className="text-xs text-slate-500">
            OAuth only - revoke access anytime from your provider.
          </span>
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
