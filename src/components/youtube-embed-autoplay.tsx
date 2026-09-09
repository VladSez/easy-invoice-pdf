"use client";

import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

interface AutoPlayYouTubeEmbedProps {
  /**
   * Bare YouTube id, e.g. `pWkb_JcKouU`. Not a URL: looping a single video needs the
   * id twice, once in the path and once as `playlist`.
   */
  videoId: string;
  /** Accessible name for the iframe, and the alt text of the still shown before it. */
  title: string;
  /** Still frame standing in for the player until it is both selected and on screen. */
  posterImg: string;
  /**
   * Whether the surrounding UI is showing this embed — the selected carousel slide,
   * say. The player also has to be in the viewport before it is mounted at all.
   */
  isActive: boolean;
  className?: string;
  testId?: string;
}

/**
 * A muted, looping YouTube player that starts when it scrolls into view and is
 * unmounted again when it leaves — the marketing demos on mobile, where the
 * self-hosted MP4s are the expensive way to show the same clip.
 *
 * Only the active embed exists in the DOM: a YouTube iframe is roughly a megabyte of
 * player, so mounting all six carousel slides would cost more than the videos they
 * replace. That also means play/pause needs no `enablejsapi` postMessage plumbing —
 * mounting starts the video and unmounting stops it — at the cost of restarting a
 * clip that is swiped away and back.
 *
 * Autoplay is muted (nothing else is allowed to start on its own) and can still be
 * refused, most often on iOS; YouTube then shows its own play button over the poster,
 * which is the same tap-to-play the MP4s used to need.
 *
 * Fills its positioned parent, like the videos in `src/components/video.tsx` do.
 */
export function AutoPlayYouTubeEmbed({
  videoId,
  title,
  posterImg,
  isActive,
  className,
  testId,
}: AutoPlayYouTubeEmbedProps) {
  // the margin starts the player just before the card reaches the viewport, so it has
  // a moment to buffer instead of showing YouTube's spinner on arrival
  const { ref, inView } = useInView({ threshold: 0.3, rootMargin: "100px" });

  const shouldPlay = isActive && inView;

  return (
    <div
      ref={ref}
      className={cn("absolute left-0 top-0 h-full w-full", className)}
    >
      {shouldPlay ? (
        <iframe
          src={buildAutoPlayEmbedUrl(videoId)}
          title={title}
          // `autoplay` here is the Permissions Policy delegation: without it the
          // player is not allowed to start itself, whatever the URL asks for
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="h-full w-full border-0"
          data-testid={testId}
        />
      ) : (
        <img
          src={posterImg}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover"
          data-testid={testId ? `${testId}-poster` : undefined}
        />
      )}
    </div>
  );
}

/**
 * The player parameters behind the demo loop: muted so autoplay is allowed at all,
 * looping, and stripped of everything that would send a viewer off to YouTube.
 *
 * Controls stay on. They cost a scrubber over the bottom of the clip, but they are
 * the only way to pause, scrub or go fullscreen — and the only recovery when autoplay
 * is refused, which it still can be on iOS.
 *
 * @see https://developers.google.com/youtube/player_parameters
 */
function buildAutoPlayEmbedUrl(videoId: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    // autoplay is only ever granted to a muted player
    mute: "1",
    // without this iOS takes the video fullscreen the moment it starts
    playsinline: "1",
    loop: "1",
    // `loop` is a playlist feature; a single video has to name itself as the playlist
    playlist: videoId,
    controls: "1",
    rel: "0",
    modestbranding: "1",
    // no annotations over the demo
    iv_load_policy: "3",
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
