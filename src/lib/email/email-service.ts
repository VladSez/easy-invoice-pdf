import type { EmailProvider, OutboundEmailMessage } from "./types";

/** Sends an already-rendered PDF through a provider-neutral transport. */
export async function sendEmail({
  provider,
  message,
}: {
  provider: EmailProvider;
  message: OutboundEmailMessage;
}): Promise<void> {
  await provider.send(message);
}
