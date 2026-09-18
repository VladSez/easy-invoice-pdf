"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useCallback, useState } from "react";

import {
  disconnectMailboxResponseSchema,
  mailboxesResponseSchema,
} from "@/lib/email/contracts";
import {
  MAILBOX_PROVIDERS,
  type Mailbox,
  type MailboxProvider,
} from "@/lib/mailbox/mailbox-types";
import { normalizeClerkProvider } from "@/lib/mailbox/mailbox-utils";

/** One in-flight mailbox action; only one can run at a time. */
export type MailboxOperation =
  | { type: "connect"; provider: MailboxProvider }
  | { type: "reconnect"; mailboxId: string }
  | { type: "disconnect"; mailboxId: string };

/** Converts Clerk and ordinary errors into a message suitable for the dialog. */
function getMailboxActionError(error: unknown, fallback: string): string {
  if (isClerkAPIResponseError(error)) {
    const clerkError = error.errors[0];
    return clerkError?.longMessage ?? clerkError?.message ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

function getConnectError(error: unknown, provider: MailboxProvider): string {
  const { label } = MAILBOX_PROVIDERS[provider];

  if (
    isClerkAPIResponseError(error) &&
    error.errors.some((clerkError) => {
      return clerkError.code === "oauth_account_already_connected";
    })
  ) {
    return `A different ${label} account is already connected. Disconnect it before connecting another one.`;
  }

  return getMailboxActionError(error, `Could not connect ${label}.`);
}

/**
 * Loads and mutates the signed-in user's mailboxes.
 *
 * Connecting and reconnecting run through Clerk in the browser and navigate
 * away to the provider, so callers pass `onBeforeRedirect` to persist anything
 * that must survive the round trip.
 */
export function useMailboxes({
  onBeforeRedirect,
}: {
  onBeforeRedirect: (provider: MailboxProvider) => void;
}) {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  /**
   * The sender of the user's last successful send, as recorded by the server.
   * It arrives with every mailbox response, so it stays correct across devices
   * without the browser storing anything.
   */
  const [lastUsedMailboxId, setLastUsedMailboxId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [operation, setOperation] = useState<MailboxOperation>();
  const [error, setError] = useState<string>();

  const request = useCallback(
    async (path: string, init?: RequestInit) => {
      const token = await getToken();
      // `HeadersInit` is also `Headers` or an entry array, neither of which
      // survives an object spread -- `new Headers()` normalizes all three.
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${token}`);

      const response = await fetch(`/api/v1${path}`, {
        ...init,
        headers,
        cache: "no-store",
      });

      const payload: unknown = await response.json().catch(() => {
        return null;
      });

      if (!response.ok) {
        const parsedError =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "object" &&
          payload.error !== null &&
          "message" in payload.error
            ? String(payload.error.message)
            : undefined;

        throw new Error(parsedError ?? "The mailbox request failed");
      }

      return payload;
    },
    [getToken],
  );

  /**
   * @param reconnectedProvider The provider the user just returned from. It
   * restores a mailbox that had been disconnected while remaining the user's
   * sign-in method.
   */
  const refresh = useCallback(
    async (reconnectedProvider?: MailboxProvider) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const payload = reconnectedProvider
          ? await request("/mailboxes/reconnected", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ provider: reconnectedProvider }),
            })
          : await request("/mailboxes");

        const parsed = mailboxesResponseSchema.parse(payload);
        setMailboxes(parsed.data);
        setLastUsedMailboxId(parsed.lastUsedMailboxId);

        return parsed.data;
      } catch (error) {
        setError(
          getMailboxActionError(error, "Could not load your mailboxes."),
        );

        return undefined;
      } finally {
        setIsLoading(false);
        setHasLoaded(true);
      }
    },
    [request],
  );

  /**
   * Starts provider OAuth for a new mailbox.
   *
   * When the provider is already linked — the common "signed in with Google,
   * now connect Gmail" case — the existing account is reauthorized with the
   * send scope instead of creating a duplicate identity.
   */
  const connect = useCallback(
    async (provider: MailboxProvider) => {
      if (!user) {
        setError("Your account is still loading. Try again.");
        return;
      }

      setError(undefined);
      setOperation({ type: "connect", provider });

      try {
        onBeforeRedirect(provider);

        const { clerkStrategy, sendScope } = MAILBOX_PROVIDERS[provider];
        const refreshedUser = await user.reload();
        const linkedAccount = refreshedUser.externalAccounts.find((account) => {
          return normalizeClerkProvider(account.provider) === provider;
        });

        const account = linkedAccount
          ? await linkedAccount.reauthorize({
              redirectUrl: "/",
              additionalScopes: [sendScope],
            })
          : await refreshedUser.createExternalAccount({
              strategy: clerkStrategy,
              redirectUrl: "/",
              additionalScopes: [sendScope],
              oidcPrompt: "select_account",
            });

        const redirect = account.verification?.externalVerificationRedirectURL;
        if (redirect) window.location.assign(redirect.toString());
      } catch (error) {
        setError(getConnectError(error, provider));
        setOperation(undefined);
      }
    },
    [onBeforeRedirect, user],
  );

  /** Requests fresh provider consent for a mailbox that can no longer send. */
  const reconnect = useCallback(
    async (mailbox: Mailbox) => {
      if (!user) {
        setError("Your account is still loading. Try again.");
        return;
      }

      setError(undefined);
      setOperation({ type: "reconnect", mailboxId: mailbox.id });

      try {
        onBeforeRedirect(mailbox.provider);

        // The client User resource can lag behind the backend mailbox list
        // right after OAuth returns, so reload before resolving the account.
        const refreshedUser = await user.reload();
        const account = refreshedUser.externalAccounts.find((candidate) => {
          return candidate.id === mailbox.id;
        });

        if (!account) {
          throw new Error("This mailbox connection is no longer available.");
        }

        const updated = await account.reauthorize({
          redirectUrl: "/",
          additionalScopes: [MAILBOX_PROVIDERS[mailbox.provider].sendScope],
        });

        const redirect = updated.verification?.externalVerificationRedirectURL;
        if (redirect) window.location.assign(redirect.toString());
      } catch (error) {
        setError(
          getMailboxActionError(error, `Could not reconnect ${mailbox.email}.`),
        );
        setOperation(undefined);
      }
    },
    [onBeforeRedirect, user],
  );

  const disconnect = useCallback(
    async (mailbox: Mailbox) => {
      setError(undefined);
      setOperation({ type: "disconnect", mailboxId: mailbox.id });

      try {
        const payload = await request(
          `/mailboxes/${encodeURIComponent(mailbox.id)}`,
          { method: "DELETE" },
        );
        const result = disconnectMailboxResponseSchema.parse(payload);
        setMailboxes(result.data);
        setLastUsedMailboxId(result.lastUsedMailboxId);

        return result;
      } catch (error) {
        setError(
          getMailboxActionError(
            error,
            `Could not disconnect ${mailbox.email}.`,
          ),
        );

        return undefined;
      } finally {
        setOperation(undefined);
      }
    },
    [request],
  );

  return {
    mailboxes,
    lastUsedMailboxId,
    isLoading,
    hasLoaded,
    operation,
    error,
    clearError: useCallback(() => {
      return setError(undefined);
    }, []),
    refresh,
    connect,
    reconnect,
    disconnect,
  };
}
