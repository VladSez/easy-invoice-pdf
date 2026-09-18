import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { sendInvoiceFlag } from "@/flags";

import { SsoCallback } from "./sso-callback.client";

/**
 * Where a provider returns the browser after mailbox OAuth.
 *
 * Nothing links here while the feature is off, so the route reports 404 rather
 * than presenting a callback that has nothing to complete.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SsoCallbackPage() {
  if (!(await sendInvoiceFlag())) {
    notFound();
  }

  return <SsoCallback />;
}
