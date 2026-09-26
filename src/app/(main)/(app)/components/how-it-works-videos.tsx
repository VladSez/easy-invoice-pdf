"use client";

import { PlayIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { type CSSProperties, useState } from "react";

import { YouTubeEmbed } from "@/components/youtube-embed";
import {
  DISCORD_COMMUNITY_URL,
  HOW_IT_WORKS_VIDEOS,
  REDDIT_COMMUNITY_URL,
} from "@/config";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";

type HowItWorksVideoId = (typeof HOW_IT_WORKS_VIDEOS)[number]["id"];

const DEFAULT_VIDEO_ID = HOW_IT_WORKS_VIDEOS[0].id;

/** Rows per column once the playlist splits in two. */
const PLAYLIST_ROWS = Math.ceil(HOW_IT_WORKS_VIDEOS.length / 2);

const VALID_VIDEO_IDS = new Set(
  HOW_IT_WORKS_VIDEOS.map((video) => {
    return video.id;
  }),
);

function isValidVideoId(value: string | null): value is HowItWorksVideoId {
  return value !== null && VALID_VIDEO_IDS.has(value as HowItWorksVideoId);
}

interface HowItWorksVideosProps {
  initialVideoId?: HowItWorksVideoId;
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
 * Video player for "How it works" tutorials, with the full playlist under it.
 * Shared by the in-app dialog and the dedicated /how-it-works page.
 */
export function HowItWorksVideos({
  initialVideoId,
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

  const paramVideoId = isValidVideoId(videoParam) ? videoParam : null;

  // The tab the user picked, if any. Everything else about the active video is
  // derived, so there is nothing to keep in sync with an effect.
  const [selectedVideoId, setSelectedVideoId] =
    useState<HowItWorksVideoId | null>(null);

  // A ?video= deep link wins over an earlier tab click: the "Watch tutorial"
  // links on /how-it-works navigate without remounting this component.
  const [lastParamVideoId, setLastParamVideoId] = useState(paramVideoId);

  // This block checks if the `video` query parameter in the URL (`paramVideoId`)
  // has changed compared to what we last saw (`lastParamVideoId`). If it has changed,
  // we update `lastParamVideoId` to the new value, and reset `selectedVideoId` to null.
  // This means that the tab selection should now follow the new value from the URL.
  if (paramVideoId !== lastParamVideoId) {
    setLastParamVideoId(paramVideoId);
    setSelectedVideoId(null);
  }

  const activeVideoId =
    selectedVideoId ?? paramVideoId ?? initialVideoId ?? DEFAULT_VIDEO_ID;

  const activeVideo =
    HOW_IT_WORKS_VIDEOS.find((video) => {
      return video.id === activeVideoId;
    }) ?? HOW_IT_WORKS_VIDEOS[0];

  function handleVideoChange(videoId: HowItWorksVideoId) {
    setSelectedVideoId(videoId);
    // The event keeps its "tab" name so the analytics series stays continuous.
    umamiTrackEvent(`how-it-works-video-tab-${videoId}`);
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

      <div className="aspect-video min-h-[300px] w-full shrink-0 overflow-hidden">
        {showIframe ? (
          <YouTubeEmbed
            key={activeVideoId}
            src={activeVideo.embedUrl}
            title={activeVideo.iframeTitle}
            testId="how-it-works-video"
          />
        ) : null}
      </div>

      {/* A list rather than tabs: every tutorial keeps its full title and length at any
          width, and the list grows with the catalog instead of running out of row. From
          `sm` it splits into two columns that fill top to bottom, so the numbers read
          down the first column and then the second, as a playlist should. */}
      <ol
        className="grid shrink-0 gap-1 border-t border-slate-200 p-2 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-[repeat(var(--playlist-rows),auto)] sm:p-3"
        style={{ "--playlist-rows": PLAYLIST_ROWS } as CSSProperties}
        aria-label="Tutorials"
        data-testid="how-it-works-playlist"
      >
        {HOW_IT_WORKS_VIDEOS.map((video, index) => {
          const isActive = video.id === activeVideoId;

          return (
            <li key={video.id}>
              <button
                type="button"
                onClick={() => {
                  return handleVideoChange(video.id);
                }}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-slate-900",
                  isActive
                    ? "bg-slate-200 text-slate-950"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
                data-testid={`how-it-works-playlist-item-${video.id}`}
              >
                <span
                  aria-hidden
                  className="flex w-4 shrink-0 justify-center text-xs font-medium tabular-nums text-slate-400"
                >
                  {isActive ? (
                    <PlayIcon className="size-3 translate-x-px fill-slate-900 stroke-slate-900" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    isActive ? "font-medium" : null,
                  )}
                >
                  <span className="sm:hidden">{video.shortTitle}</span>
                  <span className="hidden sm:inline">{video.title}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-slate-500">
                  {formatDuration(video.durationSeconds)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="shrink-0 border-t border-slate-200 px-4 py-3 text-center text-xs leading-relaxed text-slate-600 sm:px-6 sm:py-4 sm:text-left sm:text-sm">
        Questions or feedback? Join our{" "}
        <a
          href={DISCORD_COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-slate-800 underline decoration-slate-400 underline-offset-2 transition-colors hover:text-slate-950 hover:decoration-slate-500"
          data-testid="how-it-works-discord"
          onClick={() => {
            return umamiTrackEvent("how-it-works-discord-click");
          }}
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
          onClick={() => {
            return umamiTrackEvent("how-it-works-reddit-click");
          }}
        >
          Reddit
        </a>{" "}
        community.
      </div>
    </div>
  );
}

/** `79` → `"1:19"`, the way YouTube labels a video's length. */
function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
