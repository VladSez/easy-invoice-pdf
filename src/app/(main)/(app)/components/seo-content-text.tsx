import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * The section heading of the crawlable copy below the editor, `HomeSeoContent` on `/`
 * and `StripeTemplateSeoContent` on `/stripe-template`, so the two share one type scale.
 * The card layouts around it are in `seo-content-cards.tsx`.
 *
 * Smaller on phones: it steps up at `sm` and again at `md`.
 */

export function SeoContentHeading({
  id,
  className,
  children,
}: SeoContentHeadingProps) {
  return (
    <h2
      id={id}
      className={cn(
        "text-balance text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl md:text-3xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}

interface SeoContentChildrenProps {
  children: ReactNode;
}

interface SeoContentHeadingProps extends SeoContentChildrenProps {
  id?: string;
  className?: string;
}
