import { cn } from "@/lib/utils";

interface YouTubeEmbedProps {
  /** A `https://www.youtube.com/embed/...` URL, e.g. from `HOW_IT_WORKS_VIDEOS`. */
  src: string;
  /** Accessible name for the iframe — screen readers read this, not the video title. */
  title: string;
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
  className,
  testId,
}: YouTubeEmbedProps) {
  return (
    <iframe
      src={src}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      className={cn("h-full w-full border-0", className)}
      data-testid={testId}
    />
  );
}
