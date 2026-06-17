"use client";

import type { ChangelogSummary } from "@/app/changelog/utils";
import { Button } from "@/components/ui/button";
import type { AppUpdatePopupVariant } from "@/app/(app)/hooks/use-changelog-update-popup";
import { DISCORD_COMMUNITY_URL, REDDIT_COMMUNITY_URL } from "@/config";
import { markChangelogAsSeen } from "@/app/(app)/utils/changelog-seen-storage";
import { markWelcomePopupSeen } from "@/app/(app)/utils/welcome-popup-seen-storage";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect } from "react";

interface ChangelogUpdatePopupProps {
  variant: AppUpdatePopupVariant;
  latestChangelog: ChangelogSummary | null;
  isOpen: boolean;
  onDismiss: () => void;
  onHowItWorksClick?: () => void;
}

function CommunityLinks() {
  return (
    <>
      {" "}
      Join our{" "}
      <a
        onClick={() => {
          umamiTrackEvent("popup-discord-community-link-clicked");
        }}
        href={DISCORD_COMMUNITY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-slate-800 underline decoration-slate-500 underline-offset-2 transition-colors hover:text-slate-950 hover:decoration-slate-800"
      >
        Discord
      </a>{" "}
      or{" "}
      <a
        onClick={() => {
          umamiTrackEvent("popup-reddit-community-link-clicked");
        }}
        href={REDDIT_COMMUNITY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-slate-800 underline decoration-slate-500 underline-offset-2 transition-colors hover:text-slate-950 hover:decoration-slate-800"
      >
        Reddit
      </a>{" "}
      community.
    </>
  );
}

const POPUP_CONTENT = {
  welcome: {
    title: "Welcome",
    bodyPrefix: "Create professional PDF invoices in your browser.",
    continueTestId: "welcome-update-continue",
    secondaryTestId: "welcome-update-how-it-works",
  },
  changelog: {
    title: "What's new",
    bodyPrefix: "Check out recent features and improvements.",
    continueTestId: "changelog-update-continue",
    secondaryTestId: "changelog-update-link",
  },
} as const satisfies Record<
  AppUpdatePopupVariant,
  {
    title: string;
    bodyPrefix: string;
    continueTestId: string;
    secondaryTestId: string;
  }
>;

export function ChangelogUpdatePopup({
  variant,
  latestChangelog,
  isOpen,
  onDismiss,
  onHowItWorksClick,
}: ChangelogUpdatePopupProps) {
  const markSeenAndDismiss = useCallback(() => {
    if (variant === "welcome") {
      markWelcomePopupSeen();
    } else if (latestChangelog) {
      markChangelogAsSeen(latestChangelog.slug);
    }

    onDismiss();
  }, [latestChangelog, onDismiss, variant]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        markSeenAndDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, markSeenAndDismiss]);

  if (!isOpen) {
    return null;
  }

  const content = POPUP_CONTENT[variant];
  const analyticsPrefix =
    variant === "welcome" ? "welcome-popup" : "changelog-update-popup";

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
      <section
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="changelog-update-popup"
        className={cn(
          "pointer-events-auto relative w-[min(27rem,calc(100vw-2rem))] overflow-visible rounded-2xl bg-white px-5 py-5 pr-36 text-slate-950 shadow-[0_18px_50px_rgba(0,0,0,0.16)] ring-1 ring-slate-300 sm:pr-40",
          "origin-bottom-right duration-300 ease-out motion-reduce:animate-none",
          "animate-in fade-in zoom-in-95 slide-in-from-bottom-4",
        )}
      >
        <Button
          type="button"
          aria-label="Close"
          data-testid="changelog-update-close"
          onClick={() => {
            umamiTrackEvent(`${analyticsPrefix}-dismissed`);
            markSeenAndDismiss();
          }}
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
        >
          <XIcon className="h-4 w-4" aria-hidden="true" />
        </Button>

        <div className="min-w-0">
          <p className="text-[18px] font-semibold leading-tight text-slate-950 sm:text-[19px]">
            {content.title}
          </p>
          <p className="mt-1.5 max-w-[14rem] text-sm leading-snug text-slate-600 sm:max-w-[15.5rem]">
            {content.bodyPrefix}
            <CommunityLinks />
          </p>
          <div className="mt-5 flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-md px-3 text-sm"
              data-testid={content.continueTestId}
              onClick={() => {
                umamiTrackEvent(`${analyticsPrefix}-continue`);
                markSeenAndDismiss();
              }}
            >
              Continue
            </Button>
            {variant === "welcome" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-md px-2.5 text-sm font-medium text-slate-600 hover:text-slate-950"
                data-testid={content.secondaryTestId}
                onClick={() => {
                  umamiTrackEvent(`${analyticsPrefix}-how-it-works`);
                  markSeenAndDismiss();
                  onHowItWorksClick?.();
                }}
              >
                How it works
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-md px-2.5 text-sm font-medium text-slate-600 hover:text-slate-950"
                data-testid={content.secondaryTestId}
                asChild
              >
                <Link
                  href="/changelog"
                  onClick={() => {
                    umamiTrackEvent(`${analyticsPrefix}-link`);
                    markSeenAndDismiss();
                  }}
                >
                  New features
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div
          aria-hidden="true"
          title=""
          className="pointer-events-none absolute bottom-[-1.25rem] flex size-52 shrink-0 items-center justify-center overflow-visible sm:bottom-[-40px] sm:right-[-10px] sm:size-60"
        >
          <img
            alt=""
            src="/easyinvoice-mascot-popup-1.png"
            loading="lazy"
            decoding="async"
            className="relative z-10 h-full w-full object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.18)]"
          />
        </div>
      </section>
    </div>
  );
}
