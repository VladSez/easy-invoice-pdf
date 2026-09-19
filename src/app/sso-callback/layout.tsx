import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

import { sendInvoiceFlag } from "@/flags";

/**
 * The OAuth return route lives outside the (app) group, so it mounts Clerk
 * itself — `AuthenticateWithRedirectCallback` needs a provider to complete the
 * handshake.
 *
 * Gated on the same flag as the page it wraps, so the 404 this route serves
 * while Send is off does not drag Clerk's script along with it.
 */
export default async function SsoCallbackLayout({
  children,
}: {
  children: ReactNode;
}) {
  const isSendInvoiceEnabled = await sendInvoiceFlag();

  if (!isSendInvoiceEnabled) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
