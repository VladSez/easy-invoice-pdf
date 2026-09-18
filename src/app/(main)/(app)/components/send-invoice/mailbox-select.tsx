"use client";

import { Loader2, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { CustomTooltip } from "@/components/ui/tooltip";
import {
  MAILBOX_PROVIDERS,
  canMailboxSend,
  type Mailbox,
} from "@/lib/mailbox/mailbox-types";
import { cn } from "@/lib/utils";

import { MailboxProviderIcon } from "./mailbox-provider-icon";

/**
 * The compact `From` control: one select holding every connected mailbox plus
 * a shortcut into mailbox management. The select is the single source of truth
 * for which mailbox sends the invoice.
 */
export function MailboxSelect({
  mailboxes,
  selectedMailboxId,
  onSelect,
  onManage,
  onReconnect,
  isReconnecting,
  disabled,
}: {
  mailboxes: Mailbox[];
  selectedMailboxId: string;
  onSelect: (mailboxId: string) => void;
  onManage: () => void;
  onReconnect: (mailbox: Mailbox) => void;
  isReconnecting: boolean;
  disabled: boolean;
}) {
  const selectedMailbox = mailboxes.find(
    (mailbox) => mailbox.id === selectedMailboxId,
  );
  const mailboxNeedingReconnect = mailboxes.find(
    (mailbox) => !canMailboxSend(mailbox),
  );

  return (
    <div className="grid gap-1.5">
      <Label htmlFor="send-from">From</Label>
      <div className="flex items-center gap-2">
        {/*
          A native <option> cannot render an image, so the provider mark sits on
          the closed select and identifies whichever mailbox is selected.
        */}
        <div className="relative flex-1">
          {selectedMailbox ? (
            <MailboxProviderIcon
              provider={selectedMailbox.provider}
              className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2"
            />
          ) : null}
          <SelectNative
            id="send-from"
            value={selectedMailboxId}
            disabled={disabled}
            onChange={(event) => onSelect(event.target.value)}
            className={cn(selectedMailbox && "ps-9")}
          >
            {selectedMailbox ? null : (
              <option value="">Choose a mailbox</option>
            )}
            {mailboxes.map((mailbox) => (
              <option
                key={mailbox.id}
                value={mailbox.id}
                disabled={!canMailboxSend(mailbox)}
              >
                {mailbox.email} · {MAILBOX_PROVIDERS[mailbox.provider].label}
                {canMailboxSend(mailbox) ? "" : " — reconnect required"}
              </option>
            ))}
          </SelectNative>
        </div>

        <CustomTooltip
          // Tooltips default to z-[100], which sits under the z-[101] dialog
          // this control lives in.
          className="z-[102]"
          trigger={
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={onManage}
              aria-label="Manage mailboxes"
            >
              <Settings2 className="size-4" />
            </Button>
          }
          content="Manage mailboxes"
        />
      </div>
      {mailboxNeedingReconnect ? (
        <div className="mt-1 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>
            {mailboxNeedingReconnect.email} needs permission to send email
            again.
          </span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto h-7"
            disabled={disabled}
            onClick={() => onReconnect(mailboxNeedingReconnect)}
          >
            {isReconnecting ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : null}
            Reconnect
          </Button>
        </div>
      ) : null}
    </div>
  );
}
