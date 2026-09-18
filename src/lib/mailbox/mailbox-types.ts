/**
 * Mailbox domain model.
 *
 * A mailbox is EasyInvoicePDF's own concept of "an email account the user
 * authorized us to send invoices from".
 *
 * The send scope is requested during sign-up and sign-in, so the account a user
 * signs in with is usable the moment the session exists. That is honest about
 * timing rather than eager: clicking `Send invoice` is the only route into
 * sign-in, so consent is asked for at the one moment the user has already said
 * they want to email an invoice. It also removes the connect step entirely, and
 * with it the reauthorization a plain sign-in used to force — a provider only
 * downgrades a grant when the next authorization asks for less than the last.
 *
 * Identity and send permission stay separate concepts even so. An external
 * account can still lack the scope — linked before the connection requested it,
 * or a grant since revoked — and such an account is an identity, not a
 * mailbox.
 *
 * Clerk external accounts are only the current storage for the OAuth
 * connection. Nothing outside `mailbox-service.ts` should depend on Clerk
 * provider naming, scope strings, or account IDs, so this layer can move to a
 * database-backed OAuth store without touching the UI or the API contract.
 */

export const MAILBOX_PROVIDER_IDS = ["gmail", "outlook"] as const;

export type MailboxProvider = (typeof MAILBOX_PROVIDER_IDS)[number];

type MailboxProviderConfig = {
  label: string;
  /** Clerk's provider slug, used for backend OAuth token lookups. */
  clerkProvider: string;
  /** Clerk strategy used when connecting or reauthorizing from the browser. */
  clerkStrategy: `oauth_${string}`;
  /** The only permission this feature ever requests from the provider. */
  sendScope: string;
  /**
   * The provider's web Sent folder, for the account that did the sending.
   *
   * A sent invoice leaves no trace inside the app — the copy lives in the
   * user's own mailbox — so this is what lets them go and see it.
   */
  sentFolderUrl: (email: string) => string;
};

export const MAILBOX_PROVIDERS = {
  gmail: {
    label: "Gmail",
    clerkProvider: "google",
    clerkStrategy: "oauth_google",
    sendScope: "https://www.googleapis.com/auth/gmail.send",
    // `authuser` picks the mailbox that sent even when several Google accounts
    // are signed in to the same browser, where a plain `/u/0/` link would open
    // whichever account happens to be first.
    sentFolderUrl: (email: string) =>
      `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(email)}#sent`,
  },
  outlook: {
    label: "Outlook",
    clerkProvider: "microsoft",
    clerkStrategy: "oauth_microsoft",
    sendScope: "Mail.Send",
    // Outlook has no equivalent account hint. A work or school mailbox lives on
    // outlook.office.com instead, and Microsoft redirects such an account from
    // here to its own tenant, so this one link covers both.
    sentFolderUrl: () => "https://outlook.live.com/mail/0/sentitems",
  },
} as const satisfies Record<MailboxProvider, MailboxProviderConfig>;

/**
 * A disconnected mailbox is absent from the list rather than carrying a
 * `disconnected` status, so every mailbox the app knows about is either usable
 * or one reauthorization away from being usable.
 */
export const MAILBOX_STATUSES = ["active", "reauthorization-required"] as const;

export type MailboxStatus = (typeof MAILBOX_STATUSES)[number];

export type Mailbox = {
  id: string;
  provider: MailboxProvider;
  email: string;
  status: MailboxStatus;
};

export function canMailboxSend(mailbox: Mailbox) {
  return mailbox.status === "active";
}
