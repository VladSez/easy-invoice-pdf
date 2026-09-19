"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  MAILBOX_PROVIDERS,
  canMailboxSend,
  type Mailbox,
} from "@/lib/mailbox/mailbox-types";

import { DisconnectMailboxDialog } from "./disconnect-mailbox-dialog";
import { MailboxProviderMark } from "./mailbox-provider-icon";
import type { MailboxOperation } from "./use-mailboxes";

export function MailboxRow({
  mailbox,
  operation,
  onReconnect,
  onDisconnect,
}: {
  mailbox: Mailbox;
  operation: MailboxOperation | undefined;
  onReconnect: (mailbox: Mailbox) => void;
  onDisconnect: (mailbox: Mailbox) => void;
}) {
  const isBusy = operation !== undefined;
  /** The action running on this row, if any. */
  const activeAction =
    operation !== undefined &&
    "mailboxId" in operation &&
    operation.mailboxId === mailbox.id
      ? operation.type
      : undefined;

  return (
    <div className="flex items-center gap-3 border-t border-gray-200 p-3 first:border-t-0">
      <MailboxProviderMark provider={mailbox.provider} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {MAILBOX_PROVIDERS[mailbox.provider].label}
        </p>
        <p className="break-all text-xs text-slate-500">{mailbox.email}</p>

        {canMailboxSend(mailbox) ? null : (
          <p className="text-xs font-medium text-amber-600">
            Reconnection required
          </p>
        )}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {canMailboxSend(mailbox) ? null : (
          <Button
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={() => onReconnect(mailbox)}
          >
            {activeAction === "reconnect" ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : null}
            Reconnect
          </Button>
        )}
        <DisconnectMailboxDialog
          mailbox={mailbox}
          disabled={isBusy}
          isDisconnecting={activeAction === "disconnect"}
          onConfirm={() => onDisconnect(mailbox)}
        />
      </div>
    </div>
  );
}
