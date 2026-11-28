"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { SupportedTemplates } from "@/app/schema";
import { getRouteTemplate } from "@/utils/invoice-app-url";

/**
 * Keeps the copy below the editor on the template in use.
 *
 * A template switch in the editor only rewrites the address bar (`history.replaceState`,
 * see `replaceUrl` in `page.client.tsx`), so the page keeps the server-rendered copy of
 * the route it was loaded on. While the path still matches that route this renders that
 * copy, `children`, untouched: no extra JavaScript, and the HTML a crawler reads is the
 * prerender's. Once a switch moves the path to the other route, it renders that route's
 * copy instead, loaded from its own chunk on first use.
 */
export function TemplateSeoContentSwap({
  routeTemplate,
  children,
}: TemplateSeoContentSwapProps) {
  const pathname = usePathname();
  const currentTemplate = getRouteTemplate(pathname);

  if (currentTemplate === routeTemplate) {
    return children;
  }

  return currentTemplate === "stripe" ? (
    <StripeTemplateSeoContent />
  ) : (
    <HomeSeoContent />
  );
}

// only fetched once a switch needs them; the route's own copy arrives server-rendered
const HomeSeoContent = dynamic(async () => {
  const seoContent = await import("./home-seo-content");

  return seoContent.HomeSeoContent;
});

const StripeTemplateSeoContent = dynamic(async () => {
  const seoContent = await import("./stripe-template-seo-content");

  return seoContent.StripeTemplateSeoContent;
});

interface TemplateSeoContentSwapProps {
  /** The template of the route the page was loaded on, whose copy `children` is. */
  routeTemplate: SupportedTemplates;
  /** The route's server-rendered copy. */
  children: ReactNode;
}
