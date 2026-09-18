"use client";

import { Loader2, Send } from "lucide-react";

import type { InvoiceData } from "@/app/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAILBOX_PROVIDERS, type Mailbox } from "@/lib/mailbox/mailbox-types";
import { cn } from "@/lib/utils";

import { InvoiceSendSummary } from "./invoice-send-summary";
import { MailboxSelect } from "./mailbox-select";
import { describeInvalidRecipients } from "./recipients";
import type { EmailDraft } from "./send-draft";
import type { MailboxOperation } from "./use-mailboxes";

export type SendMode = "invoice" | "test";

/**
 * The primary send screen: compose on the left, review on the right. Mailbox
 * administration lives behind the gear next to `From`.
 */
export function ComposeInvoiceView({
  invoiceData,
  attachmentFilename,
  draft,
  invalidRecipients,
  testSentTo,
  onDraftChange,
  mailboxes,
  selectedMailboxId,
  onSelectMailbox,
  onManageMailboxes,
  onReconnect,
  operation,
  sending,
  onSend,
}: {
  invoiceData: InvoiceData;
  attachmentFilename: string;
  draft: EmailDraft;
  /** Addresses in `To` the last send attempt rejected, if any. */
  invalidRecipients: string[];
  /** The mailbox a test send has just delivered to, if any. */
  testSentTo: Mailbox | undefined;
  onDraftChange: (patch: Partial<EmailDraft>) => void;
  mailboxes: Mailbox[];
  selectedMailboxId: string;
  onSelectMailbox: (mailboxId: string) => void;
  onManageMailboxes: () => void;
  onReconnect: (mailbox: Mailbox) => void;
  operation: MailboxOperation | undefined;
  sending: SendMode | undefined;
  onSend: (mode: SendMode) => void;
}) {
  const buyerEmail = invoiceData.buyer.email ?? "";
  const recipientEmail = draft.to.trim();

  const noRecipient = recipientEmail.length === 0;
  const hasInvalidRecipients = invalidRecipients.length > 0;

  const recipientDiffersFromBuyer =
    buyerEmail.length > 0 &&
    recipientEmail.toLowerCase() !== buyerEmail.trim().toLowerCase();

  const isBusy = operation !== undefined || sending !== undefined;
  const canSend = selectedMailboxId.length > 0 && draft.to.trim().length > 0;

  return (
    <div className="grid md:grid-cols-[1fr_340px]">
      <div className="grid content-start gap-3.5 p-5">
        <MailboxSelect
          mailboxes={mailboxes}
          selectedMailboxId={selectedMailboxId}
          onSelect={onSelectMailbox}
          onManage={onManageMailboxes}
          onReconnect={onReconnect}
          isReconnecting={operation?.type === "reconnect"}
          disabled={isBusy}
        />

        <div className="grid gap-1.5">
          <Label htmlFor="send-to">To</Label>
          <Input
            id="send-to"
            type="email"
            value={draft.to}
            onChange={(event) => onDraftChange({ to: event.target.value })}
            placeholder="customer@example.com"
            aria-invalid={noRecipient || hasInvalidRecipients}
            aria-describedby={
              noRecipient || hasInvalidRecipients || recipientDiffersFromBuyer
                ? "send-to-helper"
                : undefined
            }
            className={cn(
              (noRecipient || hasInvalidRecipients) &&
                "border-red-600 placeholder:text-red-600",
            )}
          />
          {noRecipient ? (
            <p id="send-to-helper" className="text-xs text-red-600">
              Please enter a recipient email.
            </p>
          ) : null}

          {!noRecipient && hasInvalidRecipients ? (
            <p id="send-to-helper" className="text-xs text-red-600">
              {describeInvalidRecipients(invalidRecipients)}
            </p>
          ) : null}

          {!noRecipient &&
          !hasInvalidRecipients &&
          recipientDiffersFromBuyer ? (
            <p id="send-to-helper" className="text-xs text-amber-600">
              This recipient differs from the buyer email (
              <strong>{buyerEmail}</strong>) on the invoice.
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="send-cc">CC</Label>
            <Input
              id="send-cc"
              value={draft.cc}
              onChange={(event) => onDraftChange({ cc: event.target.value })}
              placeholder="Optional"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="send-bcc">BCC</Label>
            <Input
              id="send-bcc"
              value={draft.bcc}
              onChange={(event) => onDraftChange({ bcc: event.target.value })}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="send-subject">Subject</Label>
          <Input
            id="send-subject"
            value={draft.subject}
            onChange={(event) => onDraftChange({ subject: event.target.value })}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="send-body">Message</Label>
          <Textarea
            id="send-body"
            value={draft.body}
            onChange={(event) => onDraftChange({ body: event.target.value })}
            rows={6}
            className="min-h-28 leading-relaxed"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3.5 border-t border-gray-200 bg-slate-50/60 p-5 md:border-l md:border-t-0">
        <InvoiceSendSummary
          invoiceData={invoiceData}
          filename={attachmentFilename}
        />

        <div className="h-px bg-gray-200" />

        <Button disabled={isBusy || !canSend} onClick={() => onSend("invoice")}>
          {sending === "invoice" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Send className="mr-2 size-4" />
          )}
          {sending === "invoice" ? "Sending…" : "Send invoice"}
        </Button>
        <Button
          variant="outline"
          disabled={isBusy || selectedMailboxId.length === 0}
          onClick={() => onSend("test")}
        >
          {sending === "test" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : null}
          Send me a test email
        </Button>

        {testSentTo ? (
          // `role="status"` announces the result to a screen reader without
          // stealing focus from the compose fields.
          <p
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs leading-relaxed text-green-900"
          >
            Test invoice sent to <strong>{testSentTo.email}</strong>{" "}
            <a
              href={MAILBOX_PROVIDERS[testSentTo.provider].sentFolderUrl(
                testSentTo.email,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2 hover:text-green-700"
            >
              Open {MAILBOX_PROVIDERS[testSentTo.provider].label}
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
