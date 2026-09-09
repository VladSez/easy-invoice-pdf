"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

interface ManualPlayYouTubeEmbedProps {
  /**
   * Bare YouTube id, e.g. `pWkb_JcKouU`. Not a URL: looping a single video needs the
   * id twice, once in the path and once as `playlist`.
   */
  videoId: string;
  /** Accessible name for the play button and for the iframe it swaps in. */
  title: string;
  /** Still frame standing in for the player until someone asks for it. */
  posterImg: string;
  className?: string;
  testId?: string;
}

/**
 * A muted, looping YouTube player that a viewer starts by tapping, and that stops when
 * it scrolls out of view — the marketing demos on mobile, where the self-hosted MP4s
 * are the expensive way to show the same clip.
 *
 * Nothing but a still image exists until that tap. A YouTube iframe is roughly a
 * megabyte of player, so a carousel that mounted all six would cost more than the
 * videos it replaces, and mounting one per slide the viewer happens to swipe past
 * would spend that on clips nobody asked to see.
 *
 * Scrolling away unmounts the player rather than pausing it, which is what keeps this
 * free of `enablejsapi` postMessage plumbing. Coming back shows the still again and
 * needs another tap, so a video never starts on its own.
 *
 * Fills its positioned parent, like the videos in `src/components/video.tsx` do.
 */
export function ManualPlayYouTubeEmbed({
  videoId,
  title,
  posterImg,
  className,
  testId,
}: ManualPlayYouTubeEmbedProps) {
  const { ref, inView } = useInView({ threshold: 0.3 });

  const [isPlaying, setIsPlaying] = useState(false);

  // Stop a player the viewer has swiped or scrolled away from. Adjusted during render
  // off the previous value rather than from an effect, because that is all this is: a
  // piece of state that resets when something else changes.
  // https://react.dev/learn/you-might-not-need-an-effect
  const [wasInView, setWasInView] = useState(inView);
  if (wasInView !== inView) {
    setWasInView(inView);

    if (!inView) {
      setIsPlaying(false);
    }
  }

  return (
    <div
      ref={ref}
      className={cn("absolute left-0 top-0 h-full w-full", className)}
    >
      {isPlaying ? (
        <iframe
          src={buildEmbedUrl(videoId)}
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
        <>
          <img
            src={posterImg}
            // the button over it carries the name; this is the same frame twice
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            data-testid={testId ? `${testId}-poster` : undefined}
          />
          <button
            type="button"
            aria-label={title}
            onClick={() => {
              return setIsPlaying(true);
            }}
            className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-slate-800/90 shadow-lg transition-transform duration-150 hover:scale-110 active:scale-95">
              <Play className="ml-1 h-6 w-6 fill-white text-white" />
            </span>
          </button>
        </>
      )}
    </div>
  );
}

/**
 * The player parameters behind the demo loop: muted, looping, and stripped of
 * everything that would send a viewer off to YouTube.
 *
 * `autoplay` is not the page deciding to play something — the iframe only exists once
 * the play button has been pressed, and this is what saves that press from needing a
 * second one on YouTube's own button.
 *
 * Controls stay on. They cost a scrubber over the bottom of the clip, but they are the
 * only way to pause, scrub, unmute or go fullscreen.
 *
 * @see https://developers.google.com/youtube/player_parameters
 */
function buildEmbedUrl(videoId: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    // the demos are silent, and a tap on a marketing page should not make noise
    mute: "1",
    // without this iOS takes the video fullscreen the moment it starts
    playsinline: "1",
    loop: "1",
    // `loop` is a playlist feature; a single video has to name itself as the playlist
    playlist: videoId,
    // show controls
    controls: "1",
    rel: "0",
    modestbranding: "1",
    // no annotations over the demo
    iv_load_policy: "3",
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
