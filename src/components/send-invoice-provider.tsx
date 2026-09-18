"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Carries the `send-invoice` flag from the server into client components.
 *
 * Flags evaluate server-side only, and the Send UI lives several levels below
 * the nearest server component, so the value is resolved once per request and
 * handed down. One evaluation per request also means every gate in the tree
 * agrees: nothing can render half the feature.
 *
 * Defaults to off, so a subtree mounted without the provider — a test, or a
 * page that never resolved the flag — shows no Send feature rather than one
 * that cannot work.
 */
const SendInvoiceEnabledContext = createContext(false);

export function SendInvoiceProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <SendInvoiceEnabledContext.Provider value={enabled}>
      {children}
    </SendInvoiceEnabledContext.Provider>
  );
}

/**
 * React hook to access the current "send invoice" enabled state from context.
 *
 * Returns a boolean indicating whether the "send invoice" feature is enabled for the subtree,
 * as provided by the nearest {@link SendInvoiceProvider} in the component tree.
 *
 */
export function useSendInvoiceEnabled() {
  return useContext(SendInvoiceEnabledContext);
}
