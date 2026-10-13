import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Text building blocks for the crawlable copy below the editor, `HomeSeoContent` on `/`
 * and `StripeTemplateSeoContent` on `/stripe-template`, so the two sections share one
 * type scale.
 *
 * Smaller on phones. Every size steps up at `sm` (headings once more at `md`), so headings
 * and body text never sit at mismatched sizes between breakpoints.
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

/** The opening paragraphs under a section's first heading, a step larger than body text. */
export function SeoContentLead({ children }: SeoContentChildrenProps) {
  return (
    <p className="mt-4 text-pretty text-base leading-relaxed sm:text-lg">
      {children}
    </p>
  );
}

/** Body copy. Spaced like the other blocks; pass `className` to change the top margin. */
export function SeoContentParagraph({
  className,
  children,
}: SeoContentParagraphProps) {
  return (
    <p
      className={cn(
        "mt-4 text-pretty text-sm leading-relaxed sm:text-base",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SeoContentList({ children }: SeoContentChildrenProps) {
  return <ul className={cn("list-disc", LIST_CLASS_NAME)}>{children}</ul>;
}

export function SeoContentOrderedList({ children }: SeoContentChildrenProps) {
  return <ol className={cn("list-decimal", LIST_CLASS_NAME)}>{children}</ol>;
}

const LIST_CLASS_NAME = "mt-4 space-y-2 pl-6 text-sm sm:text-base";

interface SeoContentChildrenProps {
  children: ReactNode;
}

interface SeoContentHeadingProps extends SeoContentChildrenProps {
  id?: string;
  className?: string;
}

interface SeoContentParagraphProps extends SeoContentChildrenProps {
  className?: string;
}
