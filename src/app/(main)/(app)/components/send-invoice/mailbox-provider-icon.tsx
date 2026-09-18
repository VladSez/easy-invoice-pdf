import type { MailboxProvider } from "@/lib/mailbox/mailbox-types";
import { cn } from "@/lib/utils";

/** Brand marks for the supported providers, drawn inline to avoid extra requests. */
export function MailboxProviderIcon({
  provider,
  className,
}: {
  provider: MailboxProvider;
  className?: string;
}) {
  return provider === "gmail" ? (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M12 11.1 3.6 5.4A2 2 0 0 1 5 4.8h.4L12 9.2l6.6-4.4h.4a2 2 0 0 1 1.4.6L12 11.1z"
      />
      <path
        fill="#4285F4"
        d="M20.5 5.5c.3.3.5.8.5 1.3v10.4a2 2 0 0 1-2 2h-1.5V8.6l3-3.1z"
      />
      <path
        fill="#34A853"
        d="M3.5 5.5l3 3.1v10.6H5a2 2 0 0 1-2-2V6.8c0-.5.2-1 .5-1.3z"
      />
      <path
        fill="#FBBC04"
        d="M6.5 8.6 12 12.3l5.5-3.7v10.6h-11V8.6z"
        opacity=".2"
      />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      <rect x="2" y="5" width="12" height="14" rx="2" fill="#0F6CBD" />
      <ellipse cx="8" cy="12" rx="3.2" ry="3.6" fill="#fff" />
      <ellipse cx="8" cy="12" rx="1.7" ry="2.2" fill="#0F6CBD" />
      <path
        fill="#28A8EA"
        d="M14 8h7a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2h-6V8z"
        opacity=".85"
      />
      <path
        fill="#fff"
        d="m14 9 4 3 4-3v-.5a.5.5 0 0 0-.5-.5H14v1z"
        opacity=".9"
      />
    </svg>
  );
}

/** The bordered square that frames a provider mark in lists. */
export function MailboxProviderMark({
  provider,
  className,
}: {
  provider: MailboxProvider;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-[9px] border border-gray-200 bg-white",
        className,
      )}
    >
      <MailboxProviderIcon provider={provider} />
    </span>
  );
}
