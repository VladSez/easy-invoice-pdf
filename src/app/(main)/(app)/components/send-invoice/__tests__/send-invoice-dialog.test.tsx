// @vitest-environment happy-dom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderInvoicePdfBlob } from "@/app/(main)/(app)/utils/render-invoice-pdf-client";
import type { InvoiceData } from "@/app/schema";
import { SendInvoiceProvider } from "@/components/send-invoice-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MAX_EMAIL_PDF_BYTES } from "@/lib/email/contracts";
import type { Mailbox } from "@/lib/mailbox/mailbox-types";
import { MOCK_INVOICE_DATA } from "@/utils/__tests__/data";

import { SendInvoiceFeature } from "../send-invoice-dialog";

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

const createExternalAccount = vi.fn();
const openSignIn = vi.fn();
const reauthorize = vi.fn(async () => ({}));
const getToken = vi.fn(async () => "session-token");

let isAuthLoaded = true;
let isSignedIn = false;
let externalAccounts: Array<{ id: string; provider: string }> = [];

const user = {
  createExternalAccount,
  get externalAccounts() {
    return externalAccounts.map((account) => ({ ...account, reauthorize }));
  },
  reload: vi.fn(async () => user),
};

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken, isLoaded: isAuthLoaded, isSignedIn }),
  useUser: () => ({ user: isSignedIn ? user : null }),
  useClerk: () => ({ openSignIn }),
}));

vi.mock("@clerk/nextjs/errors", () => ({
  isClerkAPIResponseError: (error: unknown) =>
    typeof error === "object" && error !== null && "errors" in error,
}));

const PDF_FILENAME = "invoice-EN-42.pdf";

vi.mock("@/app/(main)/(app)/utils/render-invoice-pdf-client", () => ({
  renderInvoicePdfBlob: vi.fn(),
  getInvoicePdfFilename: vi.fn(() => "invoice-EN-42.pdf"),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

const renderPdf = vi.mocked(renderInvoicePdfBlob);

const gmailMailbox: Mailbox = {
  id: "eac_google_1",
  provider: "gmail",
  email: "sender@example.com",
  status: "active",
};

const outlookMailbox: Mailbox = {
  id: "eac_microsoft_1",
  provider: "outlook",
  email: "sender@outlook.com",
  status: "active",
};

type RecordedCall = {
  url: string;
  method: string;
  headers?: HeadersInit;
  body?: unknown;
};

/**
 * Serves the mailbox API from a mutable list and records every request.
 *
 * `lastUsedMailboxId` stands in for the account preference the real server
 * records on a successful send, and `keptForSignIn` for an account Clerk
 * refuses to delete because it is also a sign-in method.
 */
function stubMailboxApi(
  initial: Mailbox[],
  {
    lastUsedMailboxId,
    keptForSignIn = false,
  }: { lastUsedMailboxId?: string; keptForSignIn?: boolean } = {},
) {
  let mailboxes = initial;
  const calls: RecordedCall[] = [];

  const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = input.toString();
    const method = init?.method ?? "GET";
    calls.push({ url, method, headers: init?.headers, body: init?.body });

    if (url.endsWith("/api/v1/emails/send")) {
      return Response.json({ status: "accepted" }, { status: 202 });
    }

    if (method === "DELETE") {
      const removedId = url.split("/").pop();
      mailboxes = mailboxes.filter((mailbox) => mailbox.id !== removedId);

      return Response.json({
        data: mailboxes,
        keptForSignIn,
        lastUsedMailboxId:
          lastUsedMailboxId === removedId ? undefined : lastUsedMailboxId,
      });
    }

    return Response.json({ data: mailboxes, lastUsedMailboxId });
  });

  vi.stubGlobal("fetch", fetchMock);

  return calls;
}

/** The recorded send request, with its multipart body narrowed to FormData. */
function getSendRequest(calls: RecordedCall[]) {
  const sendCall = calls.find((call) => call.url.endsWith("/emails/send"));

  if (!(sendCall?.body instanceof FormData)) {
    throw new Error("Expected a multipart send request");
  }

  return { ...sendCall, body: sendCall.body };
}

/**
 * Mirrors the page: a TooltipProvider, inside a SendInvoiceProvider carrying
 * the flag value the server resolved. These tests are about the feature when
 * it is on; `send-invoice-feature-flag.test.tsx` covers it being off.
 */
function withProviders(children: ReactNode) {
  return (
    <SendInvoiceProvider enabled>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SendInvoiceProvider>
  );
}

function renderSendInvoice(invoiceData: InvoiceData = MOCK_INVOICE_DATA) {
  return render(
    withProviders(
      <SendInvoiceFeature invoiceData={invoiceData} qrCodeDataUrl="" />,
    ),
  );
}

const SEND_MESSAGE_KEY = "easyinvoice-send-message-v1";

/** Every key this browser currently holds, in insertion order. */
function storedKeys() {
  return Array.from({ length: localStorage.length }, (_unused, index) =>
    localStorage.key(index),
  );
}

function messageField() {
  const field = sendDialog().getByLabelText("Message");

  if (!(field instanceof HTMLTextAreaElement)) {
    throw new Error("Expected the message field to be a textarea");
  }

  return field;
}

function openSendDialog() {
  fireEvent.click(screen.getByTestId("send-invoice-button"));
}

/** The open send dialog, which is always the first one on screen. */
function sendDialog() {
  return within(screen.getAllByRole("dialog")[0]);
}

async function openManageMailboxes() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Manage mailboxes" }),
  );

  const dialogs = await screen.findAllByRole("dialog");
  const manageDialog = dialogs.at(-1);
  if (!manageDialog) throw new Error("Expected the mailbox dialog to open");

  return within(manageDialog);
}

function isDisabled(element: HTMLElement) {
  return element.hasAttribute("disabled");
}

/** The `From` selector, narrowed so options and the chosen sender can be read. */
function fromSelector() {
  const from = screen.getByRole("combobox", { name: "From" });

  if (!(from instanceof HTMLSelectElement)) {
    throw new Error("Expected the From selector");
  }

  return from;
}

describe("SendInvoiceFeature", () => {
  beforeEach(() => {
    isAuthLoaded = true;
    isSignedIn = true;
    externalAccounts = [];
    createExternalAccount.mockReset();
    openSignIn.mockClear();
    createExternalAccount.mockResolvedValue({ verification: undefined });
    reauthorize.mockClear();
    getToken.mockClear();
    toastError.mockClear();
    toastSuccess.mockClear();
    renderPdf.mockReset();
    renderPdf.mockResolvedValue(
      new Blob([Buffer.from("%PDF-test")], { type: "application/pdf" }),
    );
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("asks an unauthenticated visitor to sign in without requesting send scopes", () => {
    isSignedIn = false;
    stubMailboxApi([]);
    renderSendInvoice();

    openSendDialog();

    expect(openSignIn).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("easyinvoice-send-intent-v1")).toBe("1");
  });

  // Signing in with Google or Microsoft leaves the page and returns the
  // browser to a fresh mount, so the resumed dialog cannot rely on anything
  // held in React.
  it("opens the dialog by itself when the browser returns from signing in", async () => {
    sessionStorage.setItem("easyinvoice-send-intent-v1", "1");
    stubMailboxApi([gmailMailbox]);

    renderSendInvoice();

    expect(await screen.findByLabelText("Subject")).toBeTruthy();
    expect(sessionStorage.getItem("easyinvoice-send-intent-v1")).toBeNull();
  });

  it("stays closed for a signed-in visitor who never asked to send", async () => {
    stubMailboxApi([gmailMailbox]);

    renderSendInvoice();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    // Mailboxes are private data; a closed dialog must not fetch them.
    expect(fetch).not.toHaveBeenCalled();
  });

  it("waits for the mailbox list before offering anything to compose", async () => {
    // A request that never settles pins the dialog in its loading view.
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => undefined)),
    );
    renderSendInvoice();
    openSendDialog();

    expect((await screen.findByRole("status")).textContent).toContain(
      "Loading mailboxes",
    );
    expect(screen.queryByRole("combobox", { name: "From" })).toBeNull();
    expect(screen.queryByText("Connect a mailbox")).toBeNull();
  });

  it("shows only the connect state when no mailbox is connected", async () => {
    stubMailboxApi([]);
    renderSendInvoice();
    openSendDialog();

    expect(await screen.findByText("Connect a mailbox")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect Gmail" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Connect Outlook" }),
    ).toBeTruthy();
    expect(screen.queryByLabelText("To")).toBeNull();
    expect(screen.queryByLabelText("Subject")).toBeNull();
    expect(screen.queryByText("Summary")).toBeNull();
  });

  it("reauthorizes the sign-in account instead of creating a duplicate identity", async () => {
    externalAccounts = [{ id: "eac_google_1", provider: "google" }];
    stubMailboxApi([]);
    renderSendInvoice();
    openSendDialog();

    fireEvent.click(
      await screen.findByRole("button", { name: "Connect Gmail" }),
    );

    await waitFor(() => expect(reauthorize).toHaveBeenCalled());
    expect(reauthorize).toHaveBeenCalledWith({
      redirectUrl: "/",
      additionalScopes: ["https://www.googleapis.com/auth/gmail.send"],
    });
    expect(createExternalAccount).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("easyinvoice-send-draft-v2")).toContain(
      '"provider":"gmail"',
    );
  });

  it("composes from the only connected mailbox and sends it by ID", async () => {
    const calls = stubMailboxApi([gmailMailbox]);
    renderSendInvoice();
    openSendDialog();

    await screen.findByRole("combobox", { name: "From" });
    expect(fromSelector().value).toBe(gmailMailbox.id);
    expect(screen.getByText("sender@example.com · Gmail")).toBeTruthy();

    fireEvent.click(sendDialog().getByRole("button", { name: "Send invoice" }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    const [confirmation, confirmationOptions] = toastSuccess.mock.calls[0] as [
      string,
      { action: { label: string } },
    ];
    expect(confirmation).toBe(
      "Invoice email is sent successfully. You can check your Sent folder to see the email.",
    );
    expect(confirmationOptions.action.label).toBe("Open Gmail");

    const sendCall = getSendRequest(calls);
    expect(sendCall.method).toBe("POST");
    // Setting Content-Type by hand would drop the multipart boundary fetch
    // derives from the FormData body.
    expect(sendCall.headers).toEqual({ Authorization: "Bearer session-token" });
    expect(sendCall.body.get("mailboxId")).toBe(gmailMailbox.id);
    expect(sendCall.body.getAll("to")).toEqual([MOCK_INVOICE_DATA.buyer.email]);
    expect(sendCall.body.get("subject")).toBe("Invoice INV-2024-001");
    expect(sendCall.body.get("body")).toContain(
      "Please find your invoice attached.",
    );
    expect(sendCall.body.get("invoiceNumber")).toBe("INV-2024-001");

    const attachment = sendCall.body.get("file");
    if (!(attachment instanceof File)) {
      throw new Error("Expected the rendered PDF to be attached");
    }
    expect(attachment.name).toBe(PDF_FILENAME);
    expect(attachment.type).toBe("application/pdf");

    // A delivered invoice ends the task, so the dialog gets out of the way.
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("splits every recipient field on commas and semicolons", async () => {
    const calls = stubMailboxApi([gmailMailbox]);
    renderSendInvoice();
    openSendDialog();

    fireEvent.change(await screen.findByLabelText("To"), {
      target: { value: "first@example.com, second@example.com" },
    });
    fireEvent.change(screen.getByLabelText("CC"), {
      target: { value: " cc@example.com ; " },
    });
    fireEvent.change(screen.getByLabelText("BCC"), {
      target: { value: "bcc-one@example.com;bcc-two@example.com" },
    });

    fireEvent.click(sendDialog().getByRole("button", { name: "Send invoice" }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const { body } = getSendRequest(calls);
    expect(body.getAll("to")).toEqual([
      "first@example.com",
      "second@example.com",
    ]);
    expect(body.getAll("cc")).toEqual(["cc@example.com"]);
    expect(body.getAll("bcc")).toEqual([
      "bcc-one@example.com",
      "bcc-two@example.com",
    ]);
  });

  it("refuses a PDF over the send limit before uploading it", async () => {
    const calls = stubMailboxApi([gmailMailbox]);
    renderPdf.mockResolvedValueOnce(
      new Blob([new Uint8Array(MAX_EMAIL_PDF_BYTES + 1)], {
        type: "application/pdf",
      }),
    );
    renderSendInvoice();
    openSendDialog();

    await screen.findByRole("combobox", { name: "From" });
    const dialog = sendDialog();
    fireEvent.click(dialog.getByRole("button", { name: "Send invoice" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "This PDF is larger than the 2.5 MB Send limit.",
      ),
    );
    expect(calls.some((call) => call.url.endsWith("/emails/send"))).toBe(false);
    // The oversized attachment is a dead end, not a stuck button.
    expect(
      isDisabled(dialog.getByRole("button", { name: "Send invoice" })),
    ).toBe(false);
  });

  it("summarizes the invoice dates", async () => {
    stubMailboxApi([gmailMailbox]);
    renderSendInvoice({
      ...MOCK_INVOICE_DATA,
      dateOfServiceFieldIsVisible: true,
    });
    openSendDialog();

    expect(await screen.findByText("Date of issue")).toBeTruthy();
    expect(screen.getByText("2024-01-15")).toBeTruthy();
    expect(screen.getByText("Date of sales/service")).toBeTruthy();
    expect(screen.getByText("2024-01-31")).toBeTruthy();
    expect(screen.getByText("Due date")).toBeTruthy();
    expect(screen.getByText("2024-01-29")).toBeTruthy();
  });

  it("shows the invoice number next to the total", async () => {
    stubMailboxApi([gmailMailbox]);
    renderSendInvoice();
    openSendDialog();

    expect(await screen.findByText("Invoice no. INV-2024-001")).toBeTruthy();
  });

  it("hides the date of sales when the PDF leaves it out", async () => {
    stubMailboxApi([gmailMailbox]);
    renderSendInvoice({
      ...MOCK_INVOICE_DATA,
      dateOfServiceFieldIsVisible: false,
    });
    openSendDialog();

    expect(await screen.findByText("Date of issue")).toBeTruthy();
    expect(screen.queryByText("Date of sales/service")).toBeNull();
  });

  it("keeps the date of sales on the Stripe template", async () => {
    stubMailboxApi([gmailMailbox]);
    renderSendInvoice({
      ...MOCK_INVOICE_DATA,
      template: "stripe",
      dateOfServiceFieldIsVisible: true,
    });
    openSendDialog();

    expect(await screen.findByText("Date of sales/service")).toBeTruthy();
    expect(screen.getByText("2024-01-31")).toBeTruthy();
  });

  it("labels the date of sales in English regardless of the PDF language", async () => {
    stubMailboxApi([gmailMailbox]);
    renderSendInvoice({
      ...MOCK_INVOICE_DATA,
      language: "de",
      dateOfServiceFieldIsVisible: true,
      dateOfServiceLabelText: "Verkaufsdatum/Leistungsdatum",
    });
    openSendDialog();

    expect(await screen.findByText("Date of sales/service")).toBeTruthy();
    expect(screen.queryByText("Verkaufsdatum/Leistungsdatum")).toBeNull();
  });

  it("sends a test copy to the connected mailbox and nobody else", async () => {
    const calls = stubMailboxApi([gmailMailbox]);
    renderSendInvoice();
    openSendDialog();

    // A test must never reach the client, so the composed recipients are
    // deliberately populated before it runs.
    fireEvent.change(await screen.findByLabelText("CC"), {
      target: { value: "cc@example.com" },
    });
    fireEvent.change(screen.getByLabelText("BCC"), {
      target: { value: "bcc@example.com" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Send me a test email" }),
    );

    // The dialog stays open for this one, so the confirmation belongs on the
    // screen rather than in a toast the open modal makes unclickable.
    const confirmation = await screen.findByRole("status");
    expect(confirmation.textContent).toContain(
      "Test invoice sent to sender@example.com",
    );
    expect(
      within(confirmation)
        .getByRole("link", { name: "Open Gmail" })
        .getAttribute("href"),
    ).toBe(
      "https://mail.google.com/mail/u/?authuser=sender%40example.com#sent",
    );
    expect(toastSuccess).not.toHaveBeenCalled();

    const { body } = getSendRequest(calls);
    expect(body.getAll("to")).toEqual([gmailMailbox.email]);
    expect(body.getAll("cc")).toEqual([]);
    expect(body.getAll("bcc")).toEqual([]);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("retracts the test confirmation once the next send begins", async () => {
    stubMailboxApi([gmailMailbox]);
    renderSendInvoice();
    openSendDialog();

    await screen.findByRole("combobox", { name: "From" });
    fireEvent.click(
      screen.getByRole("button", { name: "Send me a test email" }),
    );
    await screen.findByRole("status");

    // The real send closes the dialog, and its own confirmation is a toast —
    // the inline note must not outlive the attempt that produced it.
    fireEvent.click(sendDialog().getByRole("button", { name: "Send invoice" }));

    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  // The only proof of a send lives in the user's own mailbox, so the
  // confirmation carries the trip there.
  it.each([
    {
      mailbox: gmailMailbox,
      label: "Open Gmail",
      // `authuser` opens the account that sent rather than whichever Google
      // account the browser happens to list first.
      url: "https://mail.google.com/mail/u/?authuser=sender%40example.com#sent",
    },
    {
      mailbox: outlookMailbox,
      label: "Open Outlook",
      url: "https://outlook.live.com/mail/0/sentitems",
    },
  ])(
    "offers $label on the confirmation of a send from that provider",
    async ({ mailbox, label, url }) => {
      const openMailbox = vi.fn();
      vi.stubGlobal("open", openMailbox);
      stubMailboxApi([mailbox]);
      renderSendInvoice();
      openSendDialog();

      await screen.findByRole("combobox", { name: "From" });
      fireEvent.click(
        sendDialog().getByRole("button", { name: "Send invoice" }),
      );

      await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

      const [, options] = toastSuccess.mock.calls[0] as [
        string,
        { action: { label: string; onClick: () => void } },
      ];
      expect(options.action.label).toBe(label);

      options.action.onClick();
      expect(openMailbox).toHaveBeenCalledWith(
        url,
        "_blank",
        "noopener,noreferrer",
      );
    },
  );

  it("blocks the invoice send without a recipient but still allows a test", async () => {
    stubMailboxApi([gmailMailbox]);
    renderSendInvoice();
    openSendDialog();

    fireEvent.change(await screen.findByLabelText("To"), {
      target: { value: "   " },
    });

    const dialog = sendDialog();
    expect(
      isDisabled(dialog.getByRole("button", { name: "Send invoice" })),
    ).toBe(true);
    expect(dialog.getByText("Please enter a recipient email.")).toBeTruthy();
    // A test goes to the connected mailbox, so it needs no recipient.
    expect(
      isDisabled(dialog.getByRole("button", { name: "Send me a test email" })),
    ).toBe(false);
  });

  it("checks the recipients on send rather than while the user types", async () => {
    const calls = stubMailboxApi([gmailMailbox]);
    renderSendInvoice();
    openSendDialog();

    const to = await screen.findByLabelText("To");
    fireEvent.change(to, {
      target: { value: "customer@example.com, nope, missing@" },
    });

    // Half-typed addresses must not be marked while the field is being filled.
    expect(screen.queryByText(/not valid email addresses/)).toBeNull();

    const dialog = sendDialog();
    fireEvent.click(dialog.getByRole("button", { name: "Send invoice" }));

    const message = "These are not valid email addresses: nope, missing@.";
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(message));
    expect(dialog.getByText(message)).toBeTruthy();
    expect(to.getAttribute("aria-invalid")).toBe("true");

    // Nothing was rendered or uploaded for a request the API would reject.
    expect(renderPdf).not.toHaveBeenCalled();
    expect(calls.some((call) => call.url.endsWith("/emails/send"))).toBe(false);

    // The message belongs to that one attempt, so correcting the field drops
    // it instead of leaving a stale complaint under the input.
    fireEvent.change(to, { target: { value: "customer@example.com" } });
    expect(screen.queryByText(message)).toBeNull();

    fireEvent.click(dialog.getByRole("button", { name: "Send invoice" }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(getSendRequest(calls).body.getAll("to")).toEqual([
      "customer@example.com",
    ]);
  });

  it("lists every mailbox in From and honors the chosen one", async () => {
    stubMailboxApi([gmailMailbox, outlookMailbox]);
    renderSendInvoice();
    openSendDialog();

    await screen.findByRole("combobox", { name: "From" });
    const from = fromSelector();
    expect(
      Array.from(from.options).map((option) => option.textContent),
    ).toEqual(["sender@example.com · Gmail", "sender@outlook.com · Outlook"]);

    fireEvent.change(from, { target: { value: outlookMailbox.id } });

    expect(fromSelector().value).toBe(outlookMailbox.id);
  });

  it("preselects the mailbox the last send used", async () => {
    // The preference comes from the account, so a browser that has never sent
    // still opens on the user's real sender rather than the first mailbox.
    stubMailboxApi([gmailMailbox, outlookMailbox], {
      lastUsedMailboxId: outlookMailbox.id,
    });
    renderSendInvoice();
    openSendDialog();

    await screen.findByRole("combobox", { name: "From" });
    expect(fromSelector().value).toBe(outlookMailbox.id);
    // The saved message is the only thing this feature keeps in the browser.
    expect(storedKeys()).toEqual([SEND_MESSAGE_KEY]);
  });

  it("falls back to the first mailbox that can send", async () => {
    // A remembered mailbox that is gone must not leave From empty.
    stubMailboxApi([gmailMailbox, outlookMailbox], {
      lastUsedMailboxId: "eac_removed",
    });
    renderSendInvoice();
    openSendDialog();

    await screen.findByRole("combobox", { name: "From" });
    expect(fromSelector().value).toBe(gmailMailbox.id);
  });

  it("keeps a mailbox that lost send permission out of compose", async () => {
    externalAccounts = [{ id: gmailMailbox.id, provider: "google" }];
    stubMailboxApi([{ ...gmailMailbox, status: "reauthorization-required" }]);
    renderSendInvoice();
    openSendDialog();

    expect(await screen.findByText("Reconnect your mailbox")).toBeTruthy();
    expect(
      screen.getByText(/no longer has permission to send from/),
    ).toBeTruthy();
    expect(screen.queryByLabelText("To")).toBeNull();
    expect(screen.queryByRole("combobox", { name: "From" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reconnect Gmail" }));
    await waitFor(() => expect(reauthorize).toHaveBeenCalled());
  });

  it("offers reconnect inside compose while another mailbox still sends", async () => {
    externalAccounts = [{ id: outlookMailbox.id, provider: "microsoft" }];
    stubMailboxApi([
      gmailMailbox,
      { ...outlookMailbox, status: "reauthorization-required" },
    ]);
    renderSendInvoice();
    openSendDialog();

    expect(
      await screen.findByText(/needs permission to send email again/),
    ).toBeTruthy();

    const dialog = sendDialog();
    // Gmail can still send, so the broken mailbox must not block the invoice.
    expect(
      isDisabled(dialog.getByRole("button", { name: "Send invoice" })),
    ).toBe(false);
    expect(fromSelector().value).toBe(gmailMailbox.id);

    fireEvent.click(dialog.getByRole("button", { name: "Reconnect" }));
    await waitFor(() =>
      expect(reauthorize).toHaveBeenCalledWith({
        redirectUrl: "/",
        additionalScopes: ["Mail.Send"],
      }),
    );
  });

  it("offers reconnect when a send fails on a revoked grant", async () => {
    externalAccounts = [{ id: gmailMailbox.id, provider: "google" }];
    // A grant revoked at the provider still lists the mailbox as active; only
    // the send reveals it.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) =>
        input.toString().endsWith("/emails/send")
          ? Response.json(
              {
                error: {
                  code: "mailbox_reauthorization_required",
                  message: "Reconnect this mailbox before sending",
                },
              },
              { status: 409 },
            )
          : Response.json({ data: [gmailMailbox] }),
      ),
    );

    renderSendInvoice();
    openSendDialog();

    await screen.findByRole("combobox", { name: "From" });
    const dialog = sendDialog();
    fireEvent.click(dialog.getByRole("button", { name: "Send invoice" }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());

    const [message, options] = toastError.mock.calls[0] as [
      string,
      { action?: { label?: string; onClick?: () => void } },
    ];
    expect(message).toBe("Reconnect this mailbox before sending");
    expect(options.action?.label).toBe("Reconnect");
    // The compose draft survives the failure.
    expect(dialog.getByLabelText("Subject")).toBeTruthy();

    // The offer is only worth making if it starts the OAuth round trip.
    options.action?.onClick?.();
    await waitFor(() =>
      expect(reauthorize).toHaveBeenCalledWith({
        redirectUrl: "/",
        additionalScopes: ["https://www.googleapis.com/auth/gmail.send"],
      }),
    );
  });

  it("keeps the draft and re-arms send when the server refuses the email", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) =>
        input.toString().endsWith("/emails/send")
          ? Response.json(
              {
                error: {
                  code: "provider_error",
                  message: "Gmail rejected the message",
                },
              },
              { status: 502 },
            )
          : Response.json({ data: [gmailMailbox] }),
      ),
    );

    renderSendInvoice();
    openSendDialog();

    const subject = await screen.findByLabelText("Subject");
    fireEvent.change(subject, { target: { value: "Kept subject" } });

    const dialog = sendDialog();
    fireEvent.click(dialog.getByRole("button", { name: "Send invoice" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Gmail rejected the message", {
        description:
          "If the request was interrupted, check Sent before sending again.",
      }),
    );

    // Retrying must not mean retyping, and must not need a page reload.
    expect((subject as HTMLInputElement).value).toBe("Kept subject");
    expect(
      isDisabled(dialog.getByRole("button", { name: "Send invoice" })),
    ).toBe(false);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("offers only connect, reconnect and disconnect in mailbox management", async () => {
    // The sender is remembered from what the user actually sends, so mailbox
    // management has no preference to nominate.
    const calls = stubMailboxApi([gmailMailbox, outlookMailbox]);
    renderSendInvoice();
    openSendDialog();
    await screen.findByRole("combobox", { name: "From" });

    const manageDialog = await openManageMailboxes();

    expect(manageDialog.queryByText("Default")).toBeNull();
    expect(
      manageDialog.queryByRole("button", { name: "Make default" }),
    ).toBeNull();
    expect(
      manageDialog.getAllByRole("button", { name: "Disconnect" }),
    ).toHaveLength(2);
    // Both providers are taken, so management offers nothing more to connect.
    expect(
      manageDialog.queryByRole("button", { name: "Connect Gmail" }),
    ).toBeNull();
    expect(
      manageDialog.queryByRole("button", { name: "Connect Outlook" }),
    ).toBeNull();
    expect(calls.every((call) => call.method === "GET")).toBe(true);
  });

  it("returns to the connect state after the last mailbox is disconnected", async () => {
    stubMailboxApi([gmailMailbox]);
    renderSendInvoice();
    openSendDialog();

    const subject = await screen.findByLabelText("Subject");
    fireEvent.change(subject, { target: { value: "Kept draft" } });

    const manageDialog = await openManageMailboxes();
    fireEvent.click(manageDialog.getByRole("button", { name: "Disconnect" }));

    const confirmation = within(await screen.findByRole("alertdialog"));
    expect(
      confirmation.getByText(/no longer be able to send invoices/),
    ).toBeTruthy();
    fireEvent.click(confirmation.getByRole("button", { name: "Disconnect" }));

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        "sender@example.com disconnected.",
      ),
    );
    expect(await screen.findByText("Connect a mailbox")).toBeTruthy();

    fireEvent.click(manageDialog.getByRole("button", { name: "Done" }));
    expect(screen.queryByLabelText("Subject")).toBeNull();

    // The compose draft is hidden, not discarded: connecting a mailbox again
    // carries it across the OAuth round trip.
    fireEvent.click(screen.getByRole("button", { name: "Connect Gmail" }));
    await waitFor(() =>
      expect(sessionStorage.getItem("easyinvoice-send-draft-v2")).toContain(
        '"subject":"Kept draft"',
      ),
    );
  });

  it("moves the sender off a mailbox the user disconnects", async () => {
    const calls = stubMailboxApi([gmailMailbox, outlookMailbox], {
      lastUsedMailboxId: outlookMailbox.id,
      keptForSignIn: true,
    });
    renderSendInvoice();
    openSendDialog();

    await screen.findByRole("combobox", { name: "From" });
    // Held as a reference: the mailbox dialog aria-hides the compose view, so
    // a role query cannot reach the selector while management is open.
    const from = fromSelector();
    expect(from.value).toBe(outlookMailbox.id);

    const manageDialog = await openManageMailboxes();
    // Rows follow the mailbox order, and the confirmation names the mailbox.
    fireEvent.click(
      manageDialog.getAllByRole("button", { name: "Disconnect" })[1],
    );

    const confirmation = within(await screen.findByRole("alertdialog"));
    expect(
      confirmation.getByText(`Disconnect ${outlookMailbox.email}?`),
    ).toBeTruthy();
    fireEvent.click(confirmation.getByRole("button", { name: "Disconnect" }));

    // Clerk keeps an account that is also a sign-in method, so the wording has
    // to stop short of claiming the account was removed.
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        `${outlookMailbox.email} can no longer send invoices. It stays available for signing in.`,
      ),
    );
    // The selected sender is gone, so From must not be left empty.
    await waitFor(() => expect(from.value).toBe(gmailMailbox.id));
    expect(
      calls.some(
        (call) =>
          call.method === "DELETE" && call.url.endsWith(outlookMailbox.id),
      ),
    ).toBe(true);
  });

  it("restores the draft and selects the new mailbox after OAuth returns", async () => {
    sessionStorage.setItem(
      "easyinvoice-send-draft-v2",
      JSON.stringify({
        to: "saved-recipient@example.com",
        cc: "saved-cc@example.com",
        bcc: "saved-bcc@example.com",
        subject: "Saved subject",
        body: "Saved message",
        provider: "outlook",
        knownMailboxIds: [gmailMailbox.id],
      }),
    );
    const calls = stubMailboxApi([gmailMailbox, outlookMailbox]);

    renderSendInvoice();

    expect(await screen.findByDisplayValue("Saved subject")).toBeTruthy();
    expect(
      await screen.findByDisplayValue("saved-recipient@example.com"),
    ).toBeTruthy();
    expect(screen.getByDisplayValue("saved-cc@example.com")).toBeTruthy();
    expect(screen.getByDisplayValue("saved-bcc@example.com")).toBeTruthy();
    expect(screen.getByDisplayValue("Saved message")).toBeTruthy();

    await screen.findByRole("combobox", { name: "From" });
    expect(fromSelector().value).toBe(outlookMailbox.id);
    expect(sessionStorage.getItem("easyinvoice-send-draft-v2")).toBeNull();
    expect(toastSuccess).toHaveBeenCalledWith(
      `${outlookMailbox.email} connected 🎉`,
    );

    // The return trip goes through the reconnected endpoint, which restores a
    // mailbox the user had disconnected while keeping it as a sign-in method.
    const reconnected = calls.find((call) =>
      call.url.endsWith("/mailboxes/reconnected"),
    );
    expect(reconnected?.method).toBe("POST");
    expect(reconnected?.body).toBe(JSON.stringify({ provider: "outlook" }));
  });

  // The usual connect reauthorizes the account the user signed in with, so the
  // mailbox that gained permission is one the list already carried.
  it("confirms a reauthorized mailbox the list already knew", async () => {
    sessionStorage.setItem(
      "easyinvoice-send-draft-v2",
      JSON.stringify({
        to: "",
        cc: "",
        bcc: "",
        subject: "Saved subject",
        body: "Saved message",
        provider: "gmail",
        knownMailboxIds: [gmailMailbox.id],
      }),
    );
    stubMailboxApi([gmailMailbox]);

    renderSendInvoice();

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        `${gmailMailbox.email} connected 🎉`,
      ),
    );
  });

  it("stays quiet when the provider granted nothing", async () => {
    sessionStorage.setItem(
      "easyinvoice-send-draft-v2",
      JSON.stringify({
        to: "",
        cc: "",
        bcc: "",
        subject: "Saved subject",
        body: "Saved message",
        provider: "gmail",
        knownMailboxIds: [gmailMailbox.id],
      }),
    );
    stubMailboxApi([{ ...gmailMailbox, status: "reauthorization-required" }]);

    renderSendInvoice();

    // Google's send checkbox starts unchecked, so the user is told which
    // control they missed rather than that their mailbox is broken.
    expect(
      await screen.findByText("Send permission wasn't granted"),
    ).toBeTruthy();
    expect(screen.getByText(/Tick it on Google's screen/)).toBeTruthy();
    expect(screen.queryByText("Reconnect your mailbox")).toBeNull();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("explains a mailbox that lost permission without blaming a round trip", async () => {
    // No stored draft: the user opened Send rather than returning from Google,
    // so the mailbox state is the story, not a checkbox they just missed.
    externalAccounts = [{ id: gmailMailbox.id, provider: "google" }];
    stubMailboxApi([{ ...gmailMailbox, status: "reauthorization-required" }]);
    renderSendInvoice();
    openSendDialog();

    expect(await screen.findByText("Reconnect your mailbox")).toBeTruthy();
    expect(screen.queryByText("Send permission wasn't granted")).toBeNull();
  });

  it("ignores a stored draft that fails runtime validation", async () => {
    sessionStorage.setItem(
      "easyinvoice-send-draft-v2",
      JSON.stringify({
        to: "untrusted@example.com",
        cc: "",
        bcc: "",
        subject: "Untrusted subject",
        body: "Untrusted message",
        provider: "unsupported-provider",
      }),
    );
    stubMailboxApi([gmailMailbox]);

    renderSendInvoice();
    openSendDialog();

    expect(
      await screen.findByDisplayValue(MOCK_INVOICE_DATA.buyer.email),
    ).toBeTruthy();
    expect(screen.queryByDisplayValue("Untrusted subject")).toBeNull();
    expect(sessionStorage.getItem("easyinvoice-send-draft-v2")).toBeNull();
  });

  it("refreshes generated content without replacing manual edits", async () => {
    stubMailboxApi([gmailMailbox]);
    const { rerender } = renderSendInvoice();
    openSendDialog();

    const subject = await screen.findByLabelText("Subject");
    const message = screen.getByLabelText("Message");
    const recipient = screen.getByLabelText("To");

    if (
      !(subject instanceof HTMLInputElement) ||
      !(message instanceof HTMLTextAreaElement) ||
      !(recipient instanceof HTMLInputElement)
    ) {
      throw new Error("Expected editable recipient, subject and message");
    }

    expect(recipient.value).toBe(MOCK_INVOICE_DATA.buyer.email);
    expect(subject.value).toMatch(/^Invoice /);

    rerender(
      withProviders(
        <SendInvoiceFeature
          invoiceData={{
            ...MOCK_INVOICE_DATA,
            language: "pl",
            buyer: {
              ...MOCK_INVOICE_DATA.buyer,
              email: "updated-buyer@example.com",
            },
          }}
          qrCodeDataUrl=""
        />,
      ),
    );

    await waitFor(() => {
      expect(recipient.value).toBe("updated-buyer@example.com");
      expect(subject.value).toMatch(/^Faktura /);
    });

    fireEvent.change(subject, { target: { value: "Custom subject" } });
    rerender(
      withProviders(
        <SendInvoiceFeature
          invoiceData={{ ...MOCK_INVOICE_DATA, language: "de" }}
          qrCodeDataUrl=""
        />,
      ),
    );

    await waitFor(() =>
      expect(message.value).toContain("im Anhang finden Sie Ihre Rechnung."),
    );
    expect(subject.value).toBe("Custom subject");
  });

  // A reload — deliberate, accidental, or forced by the browser — must not
  // cost the user the message they wrote. Unmounting and rendering again is
  // what a refresh looks like from the component's side: fresh React state,
  // the same local storage.
  it("restores an edited message after a refresh", async () => {
    stubMailboxApi([gmailMailbox]);
    renderSendInvoice();
    openSendDialog();

    fireEvent.change(await screen.findByLabelText("Message"), {
      target: { value: "See you at the workshop on Friday." },
    });

    cleanup();
    renderSendInvoice();
    openSendDialog();

    await waitFor(() =>
      expect(messageField().value).toBe("See you at the workshop on Friday."),
    );
  });

  it("relocalizes a restored message the user never edited", async () => {
    stubMailboxApi([gmailMailbox]);
    renderSendInvoice();
    openSendDialog();

    // The English default is stored as-is; nobody has typed into it.
    expect((await screen.findByLabelText("Message")).textContent).toContain(
      "Please find your invoice attached.",
    );

    cleanup();
    renderSendInvoice({ ...MOCK_INVOICE_DATA, language: "pl" });
    openSendDialog();

    await waitFor(() =>
      expect(messageField().value).toContain("W załączniku przesyłam fakturę."),
    );
  });

  it("keeps a restored message the user edited when the language changes", async () => {
    stubMailboxApi([gmailMailbox]);
    renderSendInvoice();
    openSendDialog();

    fireEvent.change(await screen.findByLabelText("Message"), {
      target: { value: "Payment is due on delivery." },
    });

    cleanup();
    renderSendInvoice({ ...MOCK_INVOICE_DATA, language: "pl" });
    openSendDialog();

    await screen.findByLabelText("Message");
    await waitFor(() =>
      expect(messageField().value).toBe("Payment is due on delivery."),
    );
  });

  it("surfaces mailbox API failures inside the dialog", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            error: { code: "internal_error", message: "Clerk is unavailable" },
          },
          { status: 500 },
        ),
      ),
    );
    renderSendInvoice();
    openSendDialog();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Clerk is unavailable",
    );
  });
});
