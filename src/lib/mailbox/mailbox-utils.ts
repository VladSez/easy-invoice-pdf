/**
 * Pure mailbox rules.
 *
 * Everything here is free of Clerk SDK calls so the interesting behaviour —
 * provider mapping, send-scope detection, sender selection and token
 * disambiguation — can be unit tested directly.
 */
import {
  MAILBOX_PROVIDERS,
  type Mailbox,
  type MailboxProvider,
} from "./mailbox-types";

/** The subset of a Clerk external account this layer reads. */
type ExternalAccountLike = {
  id: string;
  /** Google reports the deletable account ID separately from `id`. */
  externalAccountId?: string | null;
  provider: string;
  emailAddress?: string | null;
  approvedScopes?: string | null;
};

/**
 * Maps Clerk provider names such as `oauth_google` or `microsoft_graph` onto
 * mailbox providers. Unsupported external accounts (an Apple sign-in, for
 * example) return `undefined` and are ignored by the mailbox list.
 */
export function normalizeClerkProvider(
  value: string,
): MailboxProvider | undefined {
  const provider = value.replace(/^oauth_/, "").toLowerCase();

  if (provider === "google") {
    return "gmail";
  }

  if (provider === "microsoft" || provider === "microsoft_graph") {
    return "outlook";
  }

  return undefined;
}

/** Accepts either Clerk's short Microsoft scope or its full Graph URL form. */
export function hasProviderSendScope(
  provider: MailboxProvider,
  rawScope: string | null | undefined,
): boolean {
  if (!rawScope) return false;

  const scopes = rawScope.split(/[\s,]+/).map((scope) => scope.toLowerCase());
  const required = MAILBOX_PROVIDERS[provider].sendScope.toLowerCase();

  return scopes.some(
    (scope) =>
      scope === required ||
      (provider === "outlook" && scope.endsWith("/mail.send")),
  );
}

/** Google reports the deletable account ID separately from `id`. */
export function getExternalAccountMailboxId(account: ExternalAccountLike) {
  return account.externalAccountId ?? account.id;
}

/**
 * Turns Clerk external accounts into mailboxes.
 *
 * The connection requests the send scope at sign-in, so the account a user
 * signs in with normally arrives already able to send and becomes a mailbox
 * with no connect step of its own.
 *
 * An account can still lack the scope: one linked before the connection
 * requested it, one from a provider configured without it, or a grant the user
 * revoked. Such an account is only an identity, and is deliberately absent from
 * the list — showing it as a broken mailbox would tell the user to "reconnect"
 * something they never connected.
 *
 * `connectedMailboxIds` records accounts that did complete a mailbox
 * connection, so one that later loses the scope keeps appearing — as
 * `reauthorization-required`, which is the genuine reconnect case.
 *
 * `disconnectedMailboxIds` holds accounts the user disconnected that Clerk
 * refused to delete because they are also a sign-in method. They keep working
 * for authentication but must never appear as a mailbox again.
 */
export function normalizeMailboxes({
  externalAccounts,
  connectedMailboxIds = [],
  disconnectedMailboxIds = [],
}: {
  externalAccounts: ExternalAccountLike[];
  connectedMailboxIds?: string[];
  disconnectedMailboxIds?: string[];
}): Mailbox[] {
  const everConnected = new Set(connectedMailboxIds);
  const disconnected = new Set(disconnectedMailboxIds);

  return externalAccounts.flatMap((account): Mailbox[] => {
    const provider = normalizeClerkProvider(account.provider);
    const id = getExternalAccountMailboxId(account);

    if (!provider || !account.emailAddress || disconnected.has(id)) return [];

    const canSend = hasProviderSendScope(provider, account.approvedScopes);
    if (!canSend && !everConnected.has(id)) return [];

    return [
      {
        id,
        provider,
        email: account.emailAddress,
        status: canSend ? "active" : "reauthorization-required",
      },
    ];
  });
}

/**
 * Chooses which mailbox the `From` selector should show.
 *
 * `preferredIds` is tried in order — typically a just-connected mailbox, the
 * current selection, then the mailbox the last send used — before falling back
 * to the first mailbox that can send. Only active mailboxes can be selected, so
 * one that was disconnected or lost its send permission is replaced
 * automatically.
 */
export function resolveSelectedMailboxId({
  mailboxes,
  preferredIds,
}: {
  mailboxes: Mailbox[];
  preferredIds: Array<string | undefined>;
}): string | undefined {
  const active = mailboxes.filter((mailbox) => mailbox.status === "active");

  for (const preferredId of preferredIds) {
    const match = active.find((mailbox) => mailbox.id === preferredId);
    if (match) return match.id;
  }

  return active[0]?.id;
}

/**
 * Selects the OAuth access token that belongs to a mailbox.
 *
 * An exact external-account ID match is preferred. Older Clerk SDK responses
 * can report a different account ID, so a single token may be used as a
 * fallback only when the user has exactly one mailbox for that provider. With
 * multiple mailboxes, guessing could send from the wrong account.
 */
export function selectMailboxAccessToken({
  candidates,
  mailboxId,
  providerMailboxCount,
}: {
  candidates: Array<{ externalAccountId?: string; token?: string }>;
  mailboxId: string;
  providerMailboxCount: number;
}): string | undefined {
  const exact = candidates.find(
    (candidate) =>
      candidate.externalAccountId === mailboxId && Boolean(candidate.token),
  );
  if (exact?.token) return exact.token;

  if (providerMailboxCount !== 1) return undefined;

  const usable = candidates.filter((candidate) => Boolean(candidate.token));

  return usable.length === 1 ? usable[0]?.token : undefined;
}
