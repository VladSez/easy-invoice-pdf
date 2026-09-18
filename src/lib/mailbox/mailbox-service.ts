/**
 * Server-side mailbox operations.
 *
 * This is the only module that knows mailboxes are currently backed by Clerk
 * external accounts. Routes and UI work with the `Mailbox` model instead, so
 * moving mailbox OAuth out of Clerk later stays a local change.
 *
 * Requires `CLERK_SECRET_KEY`; never import it from client components.
 */
import { createClerkClient, type User } from "@clerk/backend";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { z } from "zod";

import { EmailDomainError } from "@/lib/email/types";

import {
  MAILBOX_PROVIDERS,
  type Mailbox,
  type MailboxProvider,
} from "./mailbox-types";
import {
  getExternalAccountMailboxId,
  hasProviderSendScope,
  normalizeClerkProvider,
  normalizeMailboxes,
  selectMailboxAccessToken,
} from "./mailbox-utils";

const MAILBOX_PREFERENCES_KEY = "mailboxPreferences";

/**
 * Account-level preferences stored in Clerk private metadata. OAuth tokens are
 * never stored here — Clerk keeps those and hands them out per request.
 */
const mailboxPreferencesSchema = z.object({
  /**
   * The mailbox the last successful send used. Storing it per account rather
   * than per browser is what makes the sender stick across devices, and it is
   * recorded automatically so the user never has to nominate one.
   */
  lastUsedMailboxId: z.string().optional(),
  /**
   * External accounts that completed a mailbox connection. This separates a
   * mailbox that lost its send permission from an account that was only ever
   * used to sign in.
   */
  connectedMailboxIds: z.array(z.string()).default([]),
  /**
   * Mailboxes the user disconnected that Clerk refused to delete because they
   * are also a sign-in identification.
   */
  disconnectedMailboxIds: z.array(z.string()).default([]),
});

type MailboxPreferences = z.infer<typeof mailboxPreferencesSchema>;

let clerkClient: ReturnType<typeof createClerkClient> | undefined;

function getClerkClient() {
  clerkClient ??= createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  return clerkClient;
}

/** Persisted JSON is untrusted input, so unusable metadata falls back to empty. */
function readMailboxPreferences(user: User): MailboxPreferences {
  const parsed = mailboxPreferencesSchema.safeParse(
    user.privateMetadata[MAILBOX_PREFERENCES_KEY],
  );

  return parsed.success
    ? parsed.data
    : { connectedMailboxIds: [], disconnectedMailboxIds: [] };
}

async function writeMailboxPreferences(
  userId: string,
  preferences: MailboxPreferences,
) {
  await getClerkClient().users.updateUserMetadata(userId, {
    privateMetadata: { [MAILBOX_PREFERENCES_KEY]: preferences },
  });
}

/**
 * The mailbox list together with the remembered sender.
 *
 * `lastUsedMailboxId` is only reported while that mailbox is still connected,
 * so callers never have to defend against an id that no longer resolves.
 */
export type MailboxList = {
  mailboxes: Mailbox[];
  lastUsedMailboxId?: string;
};

function toMailboxList(
  mailboxes: Mailbox[],
  lastUsedMailboxId: string | undefined,
): MailboxList {
  return {
    mailboxes,
    lastUsedMailboxId: mailboxes.some(
      (mailbox) => mailbox.id === lastUsedMailboxId,
    )
      ? lastUsedMailboxId
      : undefined,
  };
}

async function loadMailboxes(userId: string) {
  const user = await getClerkClient().users.getUser(userId);
  const preferences = readMailboxPreferences(user);

  return {
    user,
    preferences,
    mailboxes: normalizeMailboxes({
      externalAccounts: user.externalAccounts,
      connectedMailboxIds: preferences.connectedMailboxIds,
      disconnectedMailboxIds: preferences.disconnectedMailboxIds,
    }),
  };
}

export async function listMailboxes(userId: string): Promise<MailboxList> {
  const { preferences, mailboxes } = await loadMailboxes(userId);

  return toMailboxList(mailboxes, preferences.lastUsedMailboxId);
}

/**
 * Remembers the mailbox a send just used, so the next session — on any device —
 * opens with the same sender selected.
 *
 * Called after delivery, which is why it costs its own read: the mailbox state
 * fetched before sending may no longer reflect a concurrent change. Sending
 * from the already-remembered mailbox, the common case, writes nothing.
 */
export async function recordMailboxUse(
  userId: string,
  mailboxId: string,
): Promise<void> {
  const user = await getClerkClient().users.getUser(userId);
  const preferences = readMailboxPreferences(user);

  if (preferences.lastUsedMailboxId === mailboxId) return;

  await writeMailboxPreferences(userId, {
    ...preferences,
    lastUsedMailboxId: mailboxId,
  });
}

/**
 * Revokes EasyInvoicePDF's ability to send from a mailbox.
 *
 * The external account is deleted when that is safe. When Clerk refuses
 * because it is the user's last identification, the sign-in method is
 * preserved and the account is remembered as no longer being a mailbox —
 * disconnecting a mailbox must never cost the user their account.
 *
 * @returns The remaining mailboxes and whether the account was kept for sign-in.
 */
export async function disconnectMailbox(
  userId: string,
  mailboxId: string,
): Promise<MailboxList & { keptForSignIn: boolean }> {
  const { preferences, mailboxes } = await loadMailboxes(userId);

  if (!mailboxes.some((mailbox) => mailbox.id === mailboxId)) {
    throw mailboxNotFound();
  }

  const keptForSignIn = await deleteExternalAccount(userId, mailboxId);

  const disconnectedMailboxIds = keptForSignIn
    ? [...new Set([...preferences.disconnectedMailboxIds, mailboxId])]
    : preferences.disconnectedMailboxIds.filter((id) => id !== mailboxId);

  // A disconnected mailbox must not stay remembered: the next send would
  // otherwise keep pointing at an account the user just removed.
  const lastUsedMailboxId =
    preferences.lastUsedMailboxId === mailboxId
      ? undefined
      : preferences.lastUsedMailboxId;

  await writeMailboxPreferences(userId, {
    disconnectedMailboxIds,
    // Forgetting the connection is what keeps a sign-in identity from
    // reappearing as a mailbox that merely needs reconnecting.
    connectedMailboxIds: preferences.connectedMailboxIds.filter(
      (id) => id !== mailboxId,
    ),
    ...(lastUsedMailboxId ? { lastUsedMailboxId } : {}),
  });

  return {
    ...toMailboxList(
      mailboxes.filter((mailbox) => mailbox.id !== mailboxId),
      lastUsedMailboxId,
    ),
    keptForSignIn,
  };
}

/**
 * Settles mailbox state after the browser returns from provider OAuth.
 *
 * Accounts that now hold the send scope are recorded as connected, which is
 * what promotes a plain sign-in identity into a mailbox. It also reverses a
 * sign-in-preserving disconnect for that provider.
 *
 * Both effects run on return rather than before the redirect, so a canceled
 * OAuth flow changes nothing.
 */
export async function recordProviderOAuthReturn(
  userId: string,
  provider: MailboxProvider,
): Promise<MailboxList> {
  const { user, preferences } = await loadMailboxes(userId);

  const providerAccounts = user.externalAccounts.filter(
    (account) => normalizeClerkProvider(account.provider) === provider,
  );
  const providerAccountIds = new Set(
    providerAccounts.map(getExternalAccountMailboxId),
  );

  const connectedMailboxIds = [
    ...new Set([
      ...preferences.connectedMailboxIds,
      ...providerAccounts
        .filter((account) =>
          hasProviderSendScope(provider, account.approvedScopes),
        )
        .map(getExternalAccountMailboxId),
    ]),
  ];
  const disconnectedMailboxIds = preferences.disconnectedMailboxIds.filter(
    (id) => !providerAccountIds.has(id),
  );

  const hasChanges =
    connectedMailboxIds.length !== preferences.connectedMailboxIds.length ||
    disconnectedMailboxIds.length !== preferences.disconnectedMailboxIds.length;

  if (hasChanges) {
    await writeMailboxPreferences(userId, {
      ...preferences,
      connectedMailboxIds,
      disconnectedMailboxIds,
    });
  }

  return toMailboxList(
    normalizeMailboxes({
      externalAccounts: user.externalAccounts,
      connectedMailboxIds,
      disconnectedMailboxIds,
    }),
    preferences.lastUsedMailboxId,
  );
}

/**
 * Resolves the mailbox a send request may use and its provider access token.
 *
 * The client only ever supplies a mailbox ID; ownership, send capability and
 * the token all come from the authenticated user's own Clerk account.
 *
 * @throws EmailDomainError when the mailbox is unknown or cannot send.
 */
export async function getSendableMailbox(
  userId: string,
  mailboxId: string,
): Promise<{ mailbox: Mailbox; accessToken: string }> {
  const { mailboxes } = await loadMailboxes(userId);
  const mailbox = mailboxes.find((candidate) => candidate.id === mailboxId);

  if (!mailbox) {
    throw mailboxNotFound();
  }

  if (mailbox.status !== "active") {
    throw new EmailDomainError(
      "mailbox_reauthorization_required",
      "Reconnect this mailbox with send permission",
      409,
    );
  }

  const providerMailboxCount = mailboxes.filter(
    (candidate) => candidate.provider === mailbox.provider,
  ).length;

  const candidates = await getProviderAccessTokens(userId, mailbox.provider);

  const accessToken = selectMailboxAccessToken({
    candidates,
    mailboxId: mailbox.id,
    providerMailboxCount,
  });

  if (!accessToken) {
    throw new EmailDomainError(
      "mailbox_reauthorization_required",
      "Reconnect this mailbox before sending",
      409,
    );
  }

  return { mailbox, accessToken };
}

/**
 * Asks Clerk for the mailbox's provider access token.
 *
 * Clerk mints this per request by refreshing the grant against Google or
 * Microsoft, so it is the one call in the send path that routinely fails for
 * a reason outside this app: a user who revoked access, an expired refresh
 * token, a provider app whose consent has to be granted again. Clerk reports
 * all of those by throwing, not by returning an empty list, and an uncaught
 * throw here reaches the API as a bare 500 — no reconnect offer for the user,
 * and nothing in the log beyond the class name.
 *
 * Everything Clerk blames on the grant becomes the reauthorization error the
 * dialog already knows how to act on. A 5xx is Clerk itself being unavailable:
 * transient, and not something reconnecting would fix, so it stays an internal
 * error and keeps its retry semantics.
 */
async function getProviderAccessTokens(
  userId: string,
  provider: MailboxProvider,
) {
  try {
    const result = await getClerkClient().users.getUserOauthAccessToken(
      userId,
      MAILBOX_PROVIDERS[provider].clerkProvider,
    );

    return result.data;
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    if (!isClerkAPIResponseError(error) || error.status >= 500) throw error;

    // Logged where the cause is still known: by the time this reaches the API
    // error handler it is one more failed send.
    console.error(
      JSON.stringify({
        event: "mailbox_token_retrieval_failed",
        provider,
        clerkStatus: error.status,
        clerkTraceId: error.clerkTraceId,
        clerkErrors: error.errors.map((clerkError) => ({
          code: clerkError.code,
          message: clerkError.message,
        })),
      }),
    );

    throw new EmailDomainError(
      "mailbox_reauthorization_required",
      describeTokenFailure(provider, error.errors),
      409,
    );
  }
}

/**
 * What the user has to do about a mailbox that cannot mint a token.
 *
 * `oauth_missing_refresh_token` earns its own sentence because reconnecting
 * alone does not fix it. It means the provider never issued a refresh token,
 * and Google only issues one when the user passes through its consent screen —
 * which it skips for an app that already holds the scope. Until access is
 * removed at the provider, every reconnect returns another hour-long token and
 * lands the user back here.
 */
function describeTokenFailure(
  provider: MailboxProvider,
  errors: { code?: string }[],
) {
  const { label } = MAILBOX_PROVIDERS[provider];

  return errors.some((error) => error.code === "oauth_missing_refresh_token")
    ? `${label} stopped granting offline access. Remove EasyInvoicePDF from your ${label} account permissions, then reconnect this mailbox.`
    : "Reconnect this mailbox before sending";
}

function mailboxNotFound() {
  return new EmailDomainError(
    "mailbox_not_found",
    "The selected mailbox was not found",
    404,
  );
}

/**
 * @returns `true` when Clerk kept the account because it is the user's only
 * sign-in identification.
 */
async function deleteExternalAccount(userId: string, mailboxId: string) {
  try {
    // Delete through the Backend API: the Frontend User resource can omit a
    // newly connected account even while the backend already lists it.
    await getClerkClient().users.deleteUserExternalAccount({
      userId,
      externalAccountId: mailboxId,
    });

    return false;
  } catch (error) {
    if (!isClerkAPIResponseError(error)) throw error;

    const clerkError = error.errors[0];
    const clerkMessage = clerkError?.longMessage ?? clerkError?.message ?? "";

    if (clerkMessage.toLowerCase().includes("last identification")) {
      return true;
    }

    throw new EmailDomainError(
      "mailbox_removal_failed",
      clerkMessage || "Clerk could not disconnect this mailbox",
      409,
    );
  }
}
