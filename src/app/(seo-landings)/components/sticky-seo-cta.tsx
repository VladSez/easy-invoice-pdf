"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * Sticky CTA component displayed at bottom of SEO landing pages.
 * Shows a fixed banner with call-to-action to open the app.
 *
 * @param {Object} props - Component props
 * @param {string} props.href - URL to navigate to when CTA is clicked
 * @param {string} [props.className] - Optional additional CSS classes
 */
export function StickySeoCta({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] duration-500 animate-in fade-in slide-in-from-bottom-4",
        className,
      )}
    >
      <div className="pointer-events-auto w-full max-w-lg rounded-xl border bg-slate-900 p-3 shadow-lg ring-2 ring-slate-700 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:p-4">
        <p className="text-center text-sm font-medium text-slate-100 sm:text-left">
          Generate invoice in 10 seconds - no signup required
        </p>
        <Button
          asChild
          size="sm"
          className="mt-2 w-full shrink-0 bg-slate-100 text-sm text-slate-900 hover:bg-slate-100/95 sm:mt-0 sm:w-auto"
        >
          <Link href={href} scroll={false} data-testid="seo-sticky-cta">
            Open app
          </Link>
        </Button>
      </div>
    </div>
  );
}
