import { cn } from "@/lib/utils";

interface YouTubeEmbedProps {
  /** A `https://www.youtube.com/embed/...` URL, e.g. from `HOW_IT_WORKS_VIDEOS`. */
  src: string;
  /** Accessible name for the iframe — screen readers read this, not the video title. */
  title: string;
  /**
   * Start the clip on its own, muted and looping, the way the self-hosted demo it
   * stands in for does.
   *
   * Off by default: a player someone opened on purpose, like the "How it works" tabs,
   * should wait to be asked.
   */
  autoPlay?: boolean;
  className?: string;
  testId?: string;
}

/**
 * A YouTube player in an iframe, sized to fill its container.
 *
 * Used both by the "How it works" tabs and as the fallback for browsers that cannot
 * play the self-hosted demo MP4s (`src/hooks/use-supports-inline-video.ts`): YouTube
 * ships its own player and serves a rendition the device can decode, which is the
 * point of falling back to it at all.
 */
export function YouTubeEmbed({
  src,
  title,
  autoPlay = false,
  className,
  testId,
}: YouTubeEmbedProps) {
  return (
    <iframe
      src={autoPlay ? buildAutoPlayUrl(src) : src}
      title={title}
      // `autoplay` here is the Permissions Policy delegation: without it the player is
      // not allowed to start itself, whatever the URL asks for
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      className={cn("h-full w-full border-0", className)}
      data-testid={testId}
    />
  );
}

/**
 * The same URL with the parameters that make the player behave like the muted, looping
 * demo it replaces.
 *
 * Existing parameters on `src` are kept. A URL that cannot be parsed is handed back
 * untouched — this is the fallback path for browsers old enough that the MP4 does not
 * play, and a player that waits for a tap is a far better outcome there than a hero
 * with a broken iframe in it.
 *
 * @see https://developers.google.com/youtube/player_parameters
 */
function buildAutoPlayUrl(src: string) {
  let url: URL;

  try {
    url = new URL(src);
  } catch {
    return src;
  }

  url.searchParams.set("autoplay", "1");
  // no browser grants a gesture-free start to a player that can make noise, and a
  // marketing page should not make noise either way
  url.searchParams.set("mute", "1");
  // without this iOS takes the video fullscreen the moment it starts
  url.searchParams.set("playsinline", "1");
  // the only way to pause, scrub, unmute or go fullscreen once it is running
  url.searchParams.set("controls", "1");
  url.searchParams.set("rel", "0");
  url.searchParams.set("modestbranding", "1");
  // no annotations over the demo
  url.searchParams.set("iv_load_policy", "3");

  // `loop` is a playlist feature: a single video has to name itself as the playlist
  const videoId = url.pathname.split("/").pop();

  if (videoId) {
    url.searchParams.set("loop", "1");
    url.searchParams.set("playlist", videoId);
  }

  return url.toString();
}
