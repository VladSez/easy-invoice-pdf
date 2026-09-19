"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  getInvoicePdfFilename,
  renderInvoicePdfBlob,
} from "@/app/(main)/(app)/utils/render-invoice-pdf-client";
import type { InvoiceData } from "@/app/schema";
import { useSendInvoiceEnabled } from "@/components/send-invoice-provider";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomTooltip } from "@/components/ui/tooltip";
import { MAX_EMAIL_PDF_BYTES } from "@/lib/email/contracts";
import { getDefaultEmailContent } from "@/lib/email/templates";
import {
  canMailboxSend,
  MAILBOX_PROVIDERS,
  type Mailbox,
} from "@/lib/mailbox/mailbox-types";
import { resolveSelectedMailboxId } from "@/lib/mailbox/mailbox-utils";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";
import type { Prettify } from "@/types";

import { ComposeInvoiceView, type SendMode } from "./compose-invoice-view";
import { ConnectMailboxView } from "./connect-mailbox-view";
import { ManageMailboxesDialog } from "./manage-mailboxes-dialog";
import {
  describeInvalidRecipients,
  findInvalidRecipients,
  parseRecipients,
} from "./recipients";
import {
  readPersistedMessage,
  savePersistedMessage,
  saveSendDraft,
  saveSendIntent,
  takeSendDraft,
  takeSendIntent,
  type EmailDraft,
} from "./send-draft";
import { useMailboxes } from "./use-mailboxes";

/**
 * The dialog is either waiting for mailbox state, onboarding the first
 * mailbox, or composing. Mailbox management opens on top of the compose
 * screen, so it is not one of these views.
 */
type SendInvoiceView = "loading" | "connect-mailbox" | "compose";

/**
 * Toast action that takes the user to the Sent folder of the mailbox that just
 * sent, in that provider's web client.
 *
 * The proof a send worked lives in the user's own mailbox rather than in the
 * app, and the toast is the one moment the user is still looking for it — so
 * the confirmation carries the trip there instead of only describing it.
 */
function openSentFolderAction(mailbox: Mailbox) {
  const provider = MAILBOX_PROVIDERS[mailbox.provider];

  return {
    label: `Open ${provider.label}`,
    onClick: () => {
      return window.open(
        provider.sentFolderUrl(mailbox.email),
        "_blank",
        "noopener,noreferrer",
      );
    },
  };
}

type SendInvoiceFeatureProps = {
  invoiceData: InvoiceData;
  qrCodeDataUrl: string;
  /**
   * The mobile action bar renders the trigger as one half of a row, so it
   * needs a different size and weight than the header's primary button.
   */
  triggerClassName?: string;
  triggerVariant?: ButtonProps["variant"];
};

/**
 * The feature's only entry point, and the one place that decides whether it
 * exists at all.
 *
 * The value comes from the `send-invoice` flag, resolved once on the server
 * for the request. Gating here rather than at each call site keeps the header
 * and the mobile action bar from having to know about the flag, and keeps the
 * dialog's Clerk hooks out of a build where nobody can use them.
 */
export function SendInvoiceFeature(props: SendInvoiceFeatureProps) {
  const isSendInvoiceEnabled = useSendInvoiceEnabled();

  if (!isSendInvoiceEnabled) {
    return null;
  }

  return <SendInvoiceDialog {...props} />;
}

/**
 * Send invoice, from the trigger button through authentication, mailbox
 * onboarding and delivery.
 *
 * Authentication only identifies the EasyInvoicePDF user; permission to send
 * email is requested separately, and only when the user connects a mailbox.
 * The PDF is rendered after the user clicks send, then uploaded as multipart
 * form data together with the email fields.
 */
function SendInvoiceDialog({
  invoiceData,
  qrCodeDataUrl,
  triggerClassName,
  triggerVariant,
}: SendInvoiceFeatureProps) {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const { subject: defaultSubject, body: defaultBody } =
    getDefaultEmailContent(invoiceData);
  const defaultRecipient = invoiceData.buyer.email ?? "";

  const [open, setOpen] = useState(false);
  const [isManagingMailboxes, setIsManagingMailboxes] = useState(false);
  const [selectedMailboxId, setSelectedMailboxId] = useState("");
  const [sending, setSending] = useState<SendMode>();
  /**
   * Addresses in `To` that the last send attempt rejected.
   *
   * `To` is checked when the user sends rather than while they type: an
   * address is incomplete for most of the time it is being typed, so flagging
   * it early would mark a field the user is still filling in. Editing the
   * field clears this again, so the message belongs to one submission.
   */
  const [invalidRecipients, setInvalidRecipients] = useState<string[]>([]);
  /**
   * The mailbox a test send has just delivered to.
   *
   * A test deliberately leaves the dialog open, so its confirmation belongs on
   * the screen the user is still looking at rather than in a toast: a toast
   * outside an open modal cannot be clicked, is hidden from screen readers,
   * and takes its link away on a timer while the user is still deciding.
   */
  const [testSentTo, setTestSentTo] = useState<Mailbox>();
  /**
   * The provider the browser just came back from without send permission.
   *
   * Google lists "Send email on your behalf" as a checkbox that starts
   * unchecked, so clicking through its consent screen without granting
   * anything is an ordinary slip rather than a refusal. It needs its own
   * instruction: the generic "no longer has permission" copy reads as a
   * failure and never mentions the box the user has to tick.
   */
  const [missedSendPermission, setMissedSendPermission] =
    useState<Mailbox["provider"]>();
  const [draft, setDraft] = useState<EmailDraft>({
    to: defaultRecipient,
    cc: "",
    bcc: "",
    subject: defaultSubject,
    body: defaultBody,
  });

  const previousDefaults = useRef({
    to: defaultRecipient,
    subject: defaultSubject,
    body: defaultBody,
  });
  /** Set while the browser is away at the provider; consumed on return. */
  const oauthReturn = useRef<
    | {
        provider?: Mailbox["provider"];
        knownMailboxIds: Set<string>;
      }
    | undefined
  >(undefined);
  const hasLoadedForOpenDialog = useRef(false);
  /** Guards the persisting effect until the stored message has been read. */
  const hasRestoredMessage = useRef(false);
  /**
   * Reading the mailbox list through a ref keeps `handleBeforeRedirect` — and
   * therefore the mailbox hook's connect actions — stable while the user types.
   */
  const mailboxesRef = useRef<Mailbox[]>([]);

  const handleBeforeRedirect = useCallback(
    (provider: Mailbox["provider"]) => {
      saveSendDraft({
        ...draft,
        provider,
        selectedMailboxId,
        knownMailboxIds: mailboxesRef.current.map((mailbox) => {
          return mailbox.id;
        }),
      });
    },
    [draft, selectedMailboxId],
  );

  const {
    mailboxes,
    lastUsedMailboxId,
    isLoading,
    hasLoaded,
    operation,
    error,
    refresh,
    connect,
    reconnect,
    disconnect,
  } = useMailboxes({ onBeforeRedirect: handleBeforeRedirect });

  mailboxesRef.current = mailboxes;

  // Keep generated defaults in sync with the invoice, but never overwrite a
  // field the user has edited: a field is only refreshed while it still holds
  // the previous default.
  useEffect(() => {
    const previous = previousDefaults.current;
    previousDefaults.current = {
      to: defaultRecipient,
      subject: defaultSubject,
      body: defaultBody,
    };

    setDraft((current) => {
      const next = {
        ...current,
        to: current.to === previous.to ? defaultRecipient : current.to,
        subject:
          current.subject === previous.subject
            ? defaultSubject
            : current.subject,
        body: current.body === previous.body ? defaultBody : current.body,
      };

      const unchanged =
        next.to === current.to &&
        next.subject === current.subject &&
        next.body === current.body;

      return unchanged ? current : next;
    });
  }, [defaultBody, defaultRecipient, defaultSubject]);

  // The message the user last left behind outlives the tab, so a refresh —
  // deliberate or not — does not cost them what they wrote. It is read once,
  // on mount, and before anything is written back.
  useEffect(() => {
    const stored = readPersistedMessage();
    hasRestoredMessage.current = true;

    // Only the user's own writing is worth carrying across a reload. A stored
    // message that still equals the default it was generated from is copy this
    // app wrote, so the field keeps the current invoice's default instead —
    // which is what relocalizes it when the language changed in between.
    if (!stored || stored.body === stored.defaultBody) return;

    // The default it was edited away from comes back with it, so the effect
    // above can still tell an edited message from a generated one and leaves
    // this one alone on every later language change.
    previousDefaults.current = {
      ...previousDefaults.current,
      body: stored.defaultBody,
    };

    setDraft((current) => {
      return current.body === stored.body
        ? current
        : { ...current, body: stored.body };
    });
  }, []);

  // Only the message changing writes: the default is read from the ref rather
  // than tracked, so a language change that leaves an edited message alone
  // also leaves the default it was edited away from on record.
  useEffect(() => {
    if (!hasRestoredMessage.current) return;

    savePersistedMessage({
      body: draft.body,
      defaultBody: previousDefaults.current.body,
    });
  }, [draft.body]);

  // A stored draft means the browser just came back from provider OAuth.
  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn) return;

    const stored = takeSendDraft();
    if (!stored) return;

    setDraft({
      to: stored.to,
      cc: stored.cc,
      bcc: stored.bcc,
      subject: stored.subject,
      body: stored.body,
    });
    previousDefaults.current = {
      to: stored.to,
      subject: stored.subject,
      body: stored.body,
    };
    setSelectedMailboxId(stored.selectedMailboxId ?? "");
    oauthReturn.current = {
      provider: stored.provider,
      knownMailboxIds: new Set(stored.knownMailboxIds),
    };
    setOpen(true);
  }, [isAuthLoaded, isSignedIn]);

  // Signing in resumes the interrupted send instead of asking the user to
  // click Send invoice again. Google and Microsoft take the browser away and
  // return it to a fresh mount, so the intent is read back from storage rather
  // than from React state, which covers an in-page sign-in just as well.
  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn) return;
    if (!takeSendIntent()) return;

    setOpen(true);
  }, [isAuthLoaded, isSignedIn]);

  useEffect(() => {
    // Mailboxes are only needed while the dialog is open, and only once per
    // opening.
    if (!open || !isSignedIn) {
      hasLoadedForOpenDialog.current = false;
      return;
    }
    if (hasLoadedForOpenDialog.current) return;

    hasLoadedForOpenDialog.current = true;
    void refresh(oauthReturn.current?.provider);
  }, [isSignedIn, open, refresh]);

  // One place decides which mailbox sends: a just-connected mailbox wins, then
  // the current choice, then the sender of the user's last send, then the first
  // mailbox that can send.
  useEffect(() => {
    // Wait for the first load: an empty list before the fetch resolves would
    // otherwise discard the OAuth return marker.
    if (!hasLoaded) return;

    const returned = oauthReturn.current;
    oauthReturn.current = undefined;

    // Mailboxes the round trip left able to send. Connecting a provider the
    // user signed in with reauthorizes the account Clerk already linked, so the
    // mailbox that just gained permission is usually one the list already held
    // — an unknown ID alone would miss the most common connect.
    const connected = returned?.provider
      ? mailboxes.filter((mailbox) => {
          return (
            mailbox.provider === returned.provider && canMailboxSend(mailbox)
          );
        })
      : [];

    const newlyConnected =
      connected.find((mailbox) => {
        return !returned?.knownMailboxIds.has(mailbox.id);
      }) ?? connected[0];

    if (newlyConnected) {
      toast.success(`${newlyConnected.email} connected 🎉`);
    }

    // Set only for a round trip that granted nothing, and cleared by any later
    // load, so the instruction belongs to the trip the user just made.
    setMissedSendPermission(
      !newlyConnected && returned?.provider ? returned.provider : undefined,
    );

    setSelectedMailboxId((current) => {
      return (
        resolveSelectedMailboxId({
          mailboxes,
          preferredIds: [newlyConnected?.id, current, lastUsedMailboxId],
        }) ?? ""
      );
    });
  }, [hasLoaded, lastUsedMailboxId, mailboxes]);

  const handleDisconnect = async (mailbox: Mailbox) => {
    const result = await disconnect(mailbox);
    if (!result) return;

    toast.success(
      result.keptForSignIn
        ? `${mailbox.email} can no longer send invoices. It stays available for signing in.`
        : `${mailbox.email} disconnected.`,
    );
  };

  /** Renders the current invoice and submits the complete email request. */
  const handleSend = async (mode: Prettify<SendMode>) => {
    const mailbox = mailboxes.find((candidate) => {
      return candidate.id === selectedMailboxId;
    });

    if (!mailbox) {
      toast.error("Choose a mailbox to send the invoice.");
      return;
    }

    // A test send goes to the connected mailbox itself, never to the client.
    const recipients =
      mode === "test" ? [mailbox.email] : parseRecipients(draft.to);

    if (recipients.length === 0) {
      toast.error("Add at least one recipient.");
      return;
    }

    // A test send addresses the connected mailbox, so only what the user typed
    // can be malformed. Checking here spares a PDF render and an upload that
    // the send API would reject anyway.
    const rejected = findInvalidRecipients(recipients);

    setInvalidRecipients(rejected);

    if (rejected.length > 0) {
      toast.error(describeInvalidRecipients(rejected));
      return;
    }

    setSending(mode);
    // A new attempt supersedes the previous test's confirmation.
    setTestSentTo(undefined);

    try {
      const blob = await renderInvoicePdfBlob(invoiceData, qrCodeDataUrl);

      if (blob.size > MAX_EMAIL_PDF_BYTES) {
        toast.error("This PDF is larger than the 2.5 MB Send limit.");
        return;
      }

      const form = new FormData();
      form.set("mailboxId", mailbox.id);
      recipients.forEach((recipient) => {
        return form.append("to", recipient);
      });

      if (mode === "invoice") {
        parseRecipients(draft.cc).forEach((recipient) => {
          return form.append("cc", recipient);
        });
        parseRecipients(draft.bcc).forEach((recipient) => {
          return form.append("bcc", recipient);
        });
      }

      form.set("subject", draft.subject);
      form.set("body", draft.body);
      form.set("invoiceNumber", invoiceData.invoiceNumberObject?.value ?? "");
      form.set(
        "file",
        new File([blob], getInvoicePdfFilename(invoiceData), {
          type: "application/pdf",
        }),
      );

      const token = await getToken();

      // Do not set Content-Type manually: fetch must add the multipart
      // boundary that matches the FormData body.
      const response = await fetch("/api/v1/emails/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => {
          return null;
        })) as {
          error?: { code?: string; message?: string };
        } | null;
        const message = result?.error?.message ?? "The email was not accepted";

        // A grant revoked at the provider still reads as an active mailbox —
        // Clerk only finds out when it tries to refresh the token — so this is
        // the first and only moment the user can be offered a fix.
        if (result?.error?.code === "mailbox_reauthorization_required") {
          toast.error(message, {
            action: {
              label: "Reconnect",
              onClick: () => {
                return void reconnect(mailbox);
              },
            },
            duration: 10_000,
            actionButtonStyle: {
              backgroundColor: "#e60000", // lighter red
              color: "#fff", // white
            },
          });

          return;
        }

        throw new Error(message);
      }

      // The server records this mailbox as the last used sender, so nothing is
      // stored in the browser here.
      if (mode === "test") {
        setTestSentTo(mailbox);
        return;
      }

      toast.success(
        "Invoice email is sent successfully. You can check your Sent folder to see the email.",
        {
          // Long enough to notice the mailbox link and decide to follow it.
          action: openSentFolderAction(mailbox),
          duration: 10_000,
          actionButtonStyle: {
            backgroundColor: "#008a2e", // lighter green
            color: "#fff", // white
          },
        },
      );
      setOpen(false);
    } catch (error) {
      // The draft stays mounted so the user can retry without retyping.
      const message = error instanceof Error ? error.message : "Send failed";

      toast.error(message, {
        description:
          "If the request was interrupted, check Sent before sending again.",
      });
    } finally {
      setSending(undefined);
    }
  };

  // Signing in requests the send scope, so the account the user signed in with
  // normally lands here already able to send. Onboarding is still driven by
  // what can actually send rather than by what Clerk happens to have linked,
  // which is what covers an account that never got the scope or has lost it.
  const hasSendableMailbox = mailboxes.some(canMailboxSend);

  const view: SendInvoiceView =
    !isAuthLoaded || !isSignedIn || !hasLoaded || isLoading
      ? "loading"
      : hasSendableMailbox
        ? "compose"
        : "connect-mailbox";

  const invoiceNumber = invoiceData.invoiceNumberObject?.value;

  /**
   * Sending requires an account, so a signed-out click opens Clerk's modal
   * first. The intent is remembered and the dialog opens by itself once the
   * session exists — no second click on Send invoice.
   */
  const handleTriggerClick = () => {
    if (isAuthLoaded && !isSignedIn) {
      umamiTrackEvent("send-invoice-button-clicked");

      saveSendIntent();
      openSignIn();
      return;
    }

    setOpen(true);
  };

  return (
    <>
      <CustomTooltip
        trigger={
          <Button
            variant={triggerVariant}
            className={cn("relative w-full lg:w-auto", triggerClassName)}
            onClick={handleTriggerClick}
            data-testid="send-invoice-button"
          >
            <Send className="mr-2 size-4" />
            Send invoice
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-2 -top-2 rounded-full bg-blue-600 px-1.5 text-[10px] font-semibold uppercase leading-4 tracking-wide text-white ring-1 ring-blue-100"
            >
              New
            </span>
          </Button>
        }
        content={
          <div className="flex items-center gap-3 p-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                Send Invoice by Email
              </p>
              <p className="text-pretty text-xs leading-relaxed text-slate-700">
                Email this invoice straight from your own Gmail or Outlook
                mailbox. The PDF is attached for you, and the sent copy lands in
                your mailbox&apos;s Sent folder.
              </p>
            </div>
          </div>
        }
      />

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // The confirmation describes one visit to this dialog.
          if (!next) setTestSentTo(undefined);
        }}
      >
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-gray-200 px-5 py-4 text-left">
            <DialogTitle className="text-base">
              {invoiceNumber ? `Send invoice ${invoiceNumber}` : "Send invoice"}
            </DialogTitle>
            <DialogDescription>
              {view === "connect-mailbox"
                ? "Connect a mailbox to send this invoice from your own address."
                : "Compose the email on the left and review the invoice on the right."}
            </DialogDescription>
          </DialogHeader>

          {error && !isManagingMailboxes ? (
            <div
              role="alert"
              className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          ) : null}

          {view === "loading" ? (
            <div
              className="flex min-h-[492px] items-center justify-center"
              role="status"
            >
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <span className="ml-2 text-sm text-gray-700">
                Loading mailboxes…
              </span>
            </div>
          ) : view === "connect-mailbox" ? (
            <ConnectMailboxView
              awaitingPermission={mailboxes}
              missedSendPermission={missedSendPermission}
              operation={operation}
              onConnect={connect}
              onCancel={() => {
                return setOpen(false);
              }}
            />
          ) : (
            <ComposeInvoiceView
              invoiceData={invoiceData}
              attachmentFilename={getInvoicePdfFilename(invoiceData)}
              draft={draft}
              invalidRecipients={invalidRecipients}
              testSentTo={testSentTo}
              onDraftChange={(patch) => {
                if (patch.to !== undefined) setInvalidRecipients([]);
                setDraft((current) => {
                  return { ...current, ...patch };
                });
              }}
              mailboxes={mailboxes}
              selectedMailboxId={selectedMailboxId}
              onSelectMailbox={setSelectedMailboxId}
              onManageMailboxes={() => {
                return setIsManagingMailboxes(true);
              }}
              onReconnect={reconnect}
              operation={operation}
              sending={sending}
              onSend={(mode) => {
                return void handleSend(mode);
              }}
            />
          )}

          <ManageMailboxesDialog
            open={isManagingMailboxes}
            onOpenChange={setIsManagingMailboxes}
            mailboxes={mailboxes}
            operation={operation}
            error={error}
            onConnect={connect}
            onReconnect={reconnect}
            onDisconnect={(mailbox) => {
              return void handleDisconnect(mailbox);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
