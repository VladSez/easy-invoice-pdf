"use client";

import { usePathname } from "next/navigation";

import {
  getRouteTemplate,
  STRIPE_TEMPLATE_PATHNAME,
} from "@/utils/invoice-app-url";

/**
 * The "switch template" sentence in `StripeTemplateSeoContent`, the one line of that block
 * that depends on the template in use.
 *
 * A template switch rewrites the address bar with `history.replaceState` and leaves the
 * server-rendered copy alone, so after switching to the classic template a static "switch
 * to the classic template" would offer the template already open. `usePathname()` follows
 * those rewrites. The prerender sees `/stripe-template`, so the served HTML -- what a
 * crawler reads -- always has the classic-template link.
 *
 * Both links are full page loads: the app keeps the template it was opened on during
 * client-side navigation.
 */
export function StripeTemplateSwitchSentence() {
  const pathname = usePathname();

  return getRouteTemplate(pathname) === "stripe" ? (
    <p className="mt-4 text-pretty text-base leading-relaxed">
      Prefer a plainer A4 layout? Switch to the{" "}
      {/* an explicit template: a bare `/` sends a visitor whose saved invoice uses this
          template straight back here */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/?template=default"
        className="font-medium text-slate-900 underline underline-offset-4"
      >
        classic invoice template
      </a>
      . Your details carry over.
    </p>
  ) : (
    <p className="mt-4 text-pretty text-base leading-relaxed">
      Want the Stripe layout back? Switch to the{" "}
      <a
        href={STRIPE_TEMPLATE_PATHNAME}
        className="font-medium text-slate-900 underline underline-offset-4"
      >
        Stripe invoice template
      </a>
      . Your details carry over.
    </p>
  );
}
