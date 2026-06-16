"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DISCORD_COMMUNITY_URL,
  HOW_IT_WORKS_VIDEOS,
  REDDIT_COMMUNITY_URL,
} from "@/config";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type HowItWorksVideoId = (typeof HOW_IT_WORKS_VIDEOS)[number]["id"];

const DEFAULT_VIDEO_ID = HOW_IT_WORKS_VIDEOS[0].id;

const VALID_VIDEO_IDS = new Set(HOW_IT_WORKS_VIDEOS.map((video) => video.id));

function isValidVideoId(value: string | null): value is HowItWorksVideoId {
  return value !== null && VALID_VIDEO_IDS.has(value as HowItWorksVideoId);
}

interface HowItWorksVideosProps {
  initialVideoId?: HowItWorksVideoId;
  resetKey?: string | number;
  showIframe?: boolean;
  className?: string;
  /** Overrides the active video title in the heading. */
  title?: string;
  /** Overrides the active video description in the heading. */
  description?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  onVideoChange?: (videoId: HowItWorksVideoId) => void;
}

/**
 * Tabbed video player for "How it works" tutorials.
 * Shared by the in-app dialog and the dedicated /how-it-works page.
 */
export function HowItWorksVideos({
  initialVideoId,
  resetKey,
  showIframe = true,
  className,
  title,
  description,
  titleClassName,
  descriptionClassName,
  onVideoChange,
}: HowItWorksVideosProps) {
  const searchParams = useSearchParams();
  const videoParam = searchParams.get("video");

  const resolvedInitialId = isValidVideoId(videoParam)
    ? videoParam
    : (initialVideoId ?? DEFAULT_VIDEO_ID);

  const [activeVideoId, setActiveVideoId] =
    useState<HowItWorksVideoId>(resolvedInitialId);

  // Reset activeVideoId when resetKey changes, e.g. after dialog open/close.
  // If initialVideoId provided, use it, otherwise fallback to default.
  // eslint-disable-next-line react-you-might-not-need-an-effect/you-might-not-need-an-effect
  useEffect(() => {
    if (resetKey !== undefined) {
      setActiveVideoId(initialVideoId ?? DEFAULT_VIDEO_ID);
    }
  }, [resetKey, initialVideoId]);

  // Sync active tab with ?video query param in URL.
  // If videoParam is valid, update activeVideoId state.
  useEffect(() => {
    if (isValidVideoId(videoParam)) {
      setActiveVideoId(videoParam);
    }
  }, [videoParam]);

  const activeVideo =
    HOW_IT_WORKS_VIDEOS.find((video) => video.id === activeVideoId) ??
    HOW_IT_WORKS_VIDEOS[0];

  function handleTabChange(value: string) {
    const videoId = value as HowItWorksVideoId;
    setActiveVideoId(videoId);
    umamiTrackEvent(`how-it-works-video-tab-${value}`);
    onVideoChange?.(videoId);
  }

  return (
    <div
      className={cn("flex flex-col", className)}
      data-testid="how-it-works-videos-dialog-content"
    >
      <div className="shrink-0 px-4 pb-3 pt-4 text-center sm:p-6 sm:pb-4 sm:text-left">
        <h2
          className={cn(
            "pr-6 text-center text-xl font-semibold tracking-tight sm:text-2xl",
            titleClassName,
          )}
        >
          {title ?? activeVideo.title}
        </h2>
        <p
          className={cn(
            "mt-1.5 text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400",
            descriptionClassName,
          )}
        >
          {description ?? activeVideo.description}
        </p>
      </div>

      <div className="flex justify-center px-4 pb-3 sm:px-6 sm:pb-4">
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          <Tabs value={activeVideoId} onValueChange={handleTabChange}>
            <TabsList className="inline-flex h-auto w-max min-w-full justify-center gap-0.5 sm:min-w-0 sm:gap-1">
              {HOW_IT_WORKS_VIDEOS.map((video) => (
                <TabsTrigger
                  key={video.id}
                  value={video.id}
                  className="shrink-0 whitespace-nowrap px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
                  data-testid={`how-it-works-tab-${video.id}`}
                >
                  <span className="sm:hidden">{video.tabLabelShort}</span>
                  <span className="hidden sm:inline">{video.tabLabel}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="aspect-video min-h-[300px] w-full shrink-0 overflow-hidden">
        {showIframe ? (
          <iframe
            key={activeVideoId}
            src={activeVideo.embedUrl}
            title={activeVideo.iframeTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="h-full w-full border-0"
            data-testid="how-it-works-video"
          />
        ) : null}
      </div>

      <div className="shrink-0 border-t border-slate-200 px-4 py-3 text-center text-xs leading-relaxed text-slate-600 sm:px-6 sm:py-4 sm:text-left sm:text-sm">
        Questions or feedback? Join our{" "}
        <a
          href={DISCORD_COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-slate-800 underline decoration-slate-400 underline-offset-2 transition-colors hover:text-slate-950 hover:decoration-slate-500"
          data-testid="how-it-works-discord"
          onClick={() => umamiTrackEvent("how-it-works-discord-click")}
        >
          Discord
        </a>{" "}
        or{" "}
        <a
          href={REDDIT_COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-slate-800 underline decoration-slate-400 underline-offset-2 transition-colors hover:text-slate-950 hover:decoration-slate-500"
          data-testid="how-it-works-reddit"
          onClick={() => umamiTrackEvent("how-it-works-reddit-click")}
        >
          Reddit
        </a>{" "}
        community.
      </div>
    </div>
  );
}
