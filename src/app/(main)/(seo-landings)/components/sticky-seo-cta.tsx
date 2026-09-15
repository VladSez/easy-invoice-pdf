"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";

import { SEO_HERO_CTA_SELECTOR } from "./seo-cta-marker";

interface StickySeoCtaProps {
  /** Where the CTA goes. The landing's own `hero.ctaHref`. */
  href: string;
  /**
   * The landing's `hero.ctaLabel`.
   *
   * The sticky ask repeats the promise the hero made rather than naming a navigation,
   * so a reader who scrolled past "Create a Swedish Invoice" is offered that again.
   */
  label: string;
  /** The landing's slug, sent with the click so clicks are attributable to one page. */
  slug: string;
  className?: string;
}

/**
 * The CTA bar pinned to the bottom of an SEO landing.
 *
 * It stays down while the hero CTA is on screen, because putting a second ask next to the
 * first one covers the hero to say the same thing. Past the hero it stays up for the rest
 * of the page: hiding it again for each CTA it passed made it flash in and out three times
 * on the way down, and a control that comes and goes is harder to use than one that is
 * simply there.
 *
 * It is a pill that hugs its content rather than a full-width bar, so it covers about one
 * line of the page instead of three and reads as an offer rather than as a cookie notice.
 * That is also what makes always-on affordable, and why it carries no dismiss control.
 */
export function StickySeoCta({
  href,
  label,
  slug,
  className,
}: StickySeoCtaProps) {
  // Starts true because the hero CTA is on screen at first paint. The observer below
  // fires as soon as it is wired up, so the bar never flashes in and back out.
  const [heroCtaIsOnScreen, setHeroCtaIsOnScreen] = useState(true);

  useEffect(() => {
    // `SeoLandingShell` is the only caller and always marks its hero CTA, so the observer
    // is the one thing that ever moves this state.
    const heroCta = document.querySelector(SEO_HERO_CTA_SELECTOR);

    if (!heroCta) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setHeroCtaIsOnScreen(entry?.isIntersecting ?? false);
    });

    observer.observe(heroCta);

    return () => {
      observer.disconnect();
    };
  }, []);

  const isVisible = !heroCtaIsOnScreen;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-300 motion-reduce:transition-none",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
      // Kept mounted so it can fade rather than snap, so it also has to be taken out of
      // the tab order and away from the pointer while it is invisible.
      inert={!isVisible}
      data-testid="seo-sticky-cta-root"
    >
      <div className="pointer-events-auto flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-zinc-800 bg-black p-1.5 shadow-lg sm:gap-3 sm:pl-4">
        {/*
          The trust line is the first thing to go when the pill runs out of room: the
          label carries the landing's own promise and is never abbreviated, and a phone
          cannot hold both next to each other without truncating one of them.
        */}
        <p className="hidden shrink-0 text-xs text-zinc-300 sm:block">
          Free · no signup
        </p>
        <Button
          asChild
          size="sm"
          className="h-9 min-w-0 rounded-full border border-white/40 !bg-zinc-900 px-4 text-sm text-white hover:bg-white/10 hover:text-white"
        >
          <Link
            href={href}
            data-testid="seo-sticky-cta"
            onClick={() => {
              umamiTrackEvent("seo_sticky_cta_clicked", {
                data: { slug, label },
              });
            }}
          >
            <span className="truncate">{label}</span>
            <ArrowRight className="ml-1.5 size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
