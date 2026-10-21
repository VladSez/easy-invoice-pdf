"use client";

import { PlayIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import type { AppUpdatePopupVariant } from "@/app/(main)/(app)/hooks/use-changelog-update-popup";
import { Button } from "@/components/ui/button";
import { DISCORD_COMMUNITY_URL, REDDIT_COMMUNITY_URL } from "@/config";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";

interface ChangelogUpdatePopupProps {
  variant: AppUpdatePopupVariant;
  isOpen: boolean;
  onDismiss: () => void;
  onHowItWorksClick?: () => void;
  /**
   * A few words about the latest release, from its changelog post. Replaces the generic
   * line on the "What's new" variant; the welcome variant ignores it.
   */
  releaseSummary?: string;
  /**
   * Slug of the latest changelog post. On the "What's new" variant a "Read more" link to
   * that post follows the message; without it there is no link.
   */
  releaseSlug?: string;
  /**
   * YouTube video ID of the latest release. On the "What's new" variant its thumbnail sits
   * above the buttons and opens the video on YouTube; without it there is no preview.
   */
  releaseVideoId?: string;
  /**
   * Where the popup sits. `floating` is the desktop card in the bottom-right corner, with
   * the mascot. `dock` is the compact mobile card, rendered inside the bottom dock and
   * floated just above it: out of the flow, so the dock doesn't grow (and the page doesn't
   * shift) when it appears 1.5s after load, and it never covers the dock's own buttons.
   */
  layout?: "floating" | "dock";
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

/**
 * Temporarily off on the "What's new" popup, which shows without the mascot; the welcome
 * popup always has it. Flip back to `true` to bring it back to "What's new" too, along
 * with the right-hand column the card keeps free for it.
 */
const SHOW_CHANGELOG_POPUP_MASCOT = false as boolean;

const POPUP_CONTENT = {
  welcome: {
    title: "Welcome",
    bodyPrefix: "Create professional PDF invoices in your browser.",
    // The dock has no button row: "How it works" is a link that ends this sentence.
    dockBodyPrefix: "Create PDF invoices in your browser. New here? See",
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
    /**
     * The mobile dock's sentence, which runs straight into its action link. Falls back to
     * `bodyPrefix`.
     */
    dockBodyPrefix?: string;
    continueTestId: string;
    secondaryTestId: string;
  }
>;

export function ChangelogUpdatePopup({
  variant,
  isOpen,
  onDismiss,
  onHowItWorksClick,
  releaseSummary,
  releaseSlug,
  releaseVideoId,
  layout = "floating",
}: ChangelogUpdatePopupProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onDismiss]);

  if (!isOpen) {
    return null;
  }

  const content = POPUP_CONTENT[variant];

  const defaultBodyPrefix =
    layout === "dock" && "dockBodyPrefix" in content
      ? content.dockBodyPrefix
      : content.bodyPrefix;

  const bodyPrefix =
    variant === "changelog" && releaseSummary
      ? releaseSummary
      : defaultBodyPrefix;

  const analyticsPrefix =
    variant === "welcome" ? "welcome-popup" : "changelog-update-popup";

  const showMascot = variant === "welcome" || SHOW_CHANGELOG_POPUP_MASCOT;

  if (layout === "dock") {
    return (
      <DockNotice
        variant={variant}
        title={content.title}
        body={bodyPrefix}
        secondaryTestId={content.secondaryTestId}
        analyticsPrefix={analyticsPrefix}
        onDismiss={onDismiss}
        onHowItWorksClick={onHowItWorksClick}
      />
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
      <section
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="changelog-update-popup"
        className={cn(
          "pointer-events-auto relative overflow-visible rounded-2xl bg-white px-5 py-5 text-slate-950 shadow-[0_18px_50px_rgba(0,0,0,0.16)] ring-1 ring-slate-300",
          showMascot
            ? "w-[min(27rem,calc(100vw-2rem))] pr-36 sm:pr-40"
            : "w-[min(21rem,calc(100vw-2rem))]",
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
            onDismiss();
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
          <p
            className={cn(
              "mt-1.5 text-sm leading-snug text-slate-600",
              showMascot ? "max-w-[14rem] sm:max-w-[15.5rem]" : null,
            )}
          >
            {bodyPrefix}
            {variant === "changelog" && releaseSlug ? (
              <>
                {" "}
                <Link
                  href={`/changelog/${releaseSlug}`}
                  data-testid="changelog-update-latest-post-link"
                  className="whitespace-nowrap font-bold text-slate-800 underline decoration-slate-500 underline-offset-2 transition-colors hover:text-slate-950 hover:decoration-slate-800"
                  onClick={() => {
                    umamiTrackEvent(`${analyticsPrefix}-latest-post-link`);
                    onDismiss();
                  }}
                >
                  Read more
                </Link>
              </>
            ) : null}
            <br />
            <br />
            <CommunityLinks />
          </p>
          {variant === "changelog" && releaseVideoId ? (
            <ReleaseVideoPreview
              videoId={releaseVideoId}
              className={showMascot ? "w-48" : "w-full"}
              onClick={() => {
                umamiTrackEvent(`${analyticsPrefix}-video`);
              }}
            />
          ) : null}
          <div className="mt-5 flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-md px-3 text-sm"
              data-testid={content.continueTestId}
              onClick={() => {
                umamiTrackEvent(`${analyticsPrefix}-continue`);
                onDismiss();
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
                  onDismiss();
                  onHowItWorksClick?.();
                }}
              >
                How it works
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-md px-2.5 text-sm font-medium text-slate-700 hover:text-slate-950"
                data-testid={content.secondaryTestId}
                asChild
              >
                <Link
                  href="/changelog"
                  onClick={() => {
                    umamiTrackEvent(`${analyticsPrefix}-link`);
                    onDismiss();
                  }}
                >
                  Learn more
                </Link>
              </Button>
            )}
          </div>
        </div>

        {showMascot ? (
          <div
            aria-hidden="true"
            title=""
            className="pointer-events-none absolute bottom-[-1.25rem] flex size-52 shrink-0 items-center justify-center overflow-visible sm:bottom-[-20px] sm:right-[-25px] sm:size-60"
          >
            <img
              alt=""
              src="/easyinvoice-mascot-popup-1.png"
              loading="lazy"
              decoding="async"
              className="relative z-10 h-full w-full object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.18)]"
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

interface ReleaseVideoPreviewProps {
  videoId: string;
  /** Sets the width; the height follows at 16:9. */
  className?: string;
  onClick: () => void;
}

/**
 * The release video's YouTube thumbnail with a play button, opening the video in a new
 * tab. A link and not an embed: an iframe would load YouTube's player (and its cookies)
 * for everyone who sees the popup, not just those who want to watch.
 */
function ReleaseVideoPreview({
  videoId,
  className,
  onClick,
}: ReleaseVideoPreviewProps) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Watch the release video on YouTube"
      data-testid="changelog-update-video-link"
      onClick={onClick}
      className={cn(
        "group relative mt-4 block aspect-video overflow-hidden rounded-lg bg-slate-900 outline-offset-2",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900",
        className,
      )}
    >
      {/* mqdefault is 320x180 with no letterbox bars; maxresdefault covers 2x screens. It only
          exists for 720p+ uploads (otherwise YouTube serves a grey 120x90 placeholder), which
          every release video is */}
      <img
        alt=""
        src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
        srcSet={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg 1x, https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg 2x`}
        width={320}
        height={180}
        loading="lazy"
        decoding="async"
        className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
      />
      {/* An inset ring instead of a border, so it sits on the image edge */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform duration-150 ease-out group-hover:scale-110 group-active:scale-95 motion-reduce:transition-none">
          <PlayIcon className="size-5 translate-x-px fill-white stroke-white" />
        </span>
      </span>
    </a>
  );
}

interface DockNoticeProps {
  variant: AppUpdatePopupVariant;
  title: string;
  body: string;
  secondaryTestId: string;
  analyticsPrefix: string;
  onDismiss: () => void;
  onHowItWorksClick?: () => void;
}

/**
 * The popup as a compact card floating just above the mobile dock: one sentence with its
 * action at the end, and a close button. It must render inside the (sticky) dock, which it
 * is positioned against. There is no "Continue" button here -- on a phone it would only
 * repeat the close button and cover more of the form.
 */
function DockNotice({
  variant,
  title,
  body,
  secondaryTestId,
  analyticsPrefix,
  onDismiss,
  onHowItWorksClick,
}: DockNoticeProps) {
  const actionClassName =
    "whitespace-nowrap font-semibold text-slate-900 underline decoration-slate-400 underline-offset-2 hit-area-y-3 hover:decoration-slate-800";

  return (
    <section
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="changelog-update-popup"
      data-layout="dock"
      className={cn(
        "absolute inset-x-0 bottom-full mb-2 rounded-lg bg-white py-2.5 pl-3 pr-10 shadow-[0_4px_16px_rgba(0,0,0,0.12)] ring-1 ring-slate-200",
        "duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none",
      )}
    >
      <p className="text-pretty text-sm leading-snug text-slate-600">
        <span className="font-semibold text-slate-950">{title}:</span> {body}{" "}
        {variant === "welcome" ? (
          <button
            type="button"
            data-testid={secondaryTestId}
            className={actionClassName}
            onClick={() => {
              umamiTrackEvent(`${analyticsPrefix}-how-it-works`);
              onDismiss();
              onHowItWorksClick?.();
            }}
          >
            How it works
          </button>
        ) : (
          <Link
            href="/changelog"
            data-testid={secondaryTestId}
            className={actionClassName}
            onClick={() => {
              umamiTrackEvent(`${analyticsPrefix}-link`);
              onDismiss();
            }}
          >
            Learn more
          </Link>
        )}
      </p>

      <Button
        type="button"
        aria-label="Close"
        data-testid="changelog-update-close"
        onClick={() => {
          umamiTrackEvent(`${analyticsPrefix}-dismissed`);
          onDismiss();
        }}
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 flex size-10 items-center justify-center rounded-md text-slate-500 hover:bg-transparent hover:text-slate-950"
      >
        <XIcon className="h-4 w-4" aria-hidden="true" />
      </Button>
    </section>
  );
}
