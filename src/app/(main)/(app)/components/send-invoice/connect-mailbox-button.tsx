"use client";

import { Loader2, Plus, RefreshCw } from "lucide-react";

import {
  MAILBOX_PROVIDERS,
  type MailboxProvider,
} from "@/lib/mailbox/mailbox-types";
import { cn } from "@/lib/utils";

import { MailboxProviderIcon } from "./mailbox-provider-icon";

/**
 * Pill-shaped provider button used by both the connect and manage views.
 *
 * `verb` is "Reconnect" when the provider is already linked to the user's
 * account and only needs send permission, which is the same OAuth action from
 * the user's point of view but a very different sentence.
 */
export function ConnectMailboxButton({
  provider,
  onConnect,
  isConnecting,
  disabled,
  className,
  verb = "Connect",
}: {
  provider: MailboxProvider;
  onConnect: (provider: MailboxProvider) => void;
  isConnecting: boolean;
  disabled: boolean;
  className?: string;
  verb?: "Connect" | "Reconnect";
}) {
  const ActionIcon = verb === "Reconnect" ? RefreshCw : Plus;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onConnect(provider)}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white py-1.5 pl-2.5 pr-4 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:border-gray-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {isConnecting ? (
        <Loader2 className="size-4 animate-spin text-slate-400" />
      ) : (
        <ActionIcon className="size-4 text-slate-400" />
      )}
      <MailboxProviderIcon provider={provider} className="size-[17px]" />
      {verb} {MAILBOX_PROVIDERS[provider].label}
    </button>
  );
}
