import { AutoPlayVideo } from "@/components/video";
import { AutoPlayYouTubeEmbed } from "@/components/youtube-embed-autoplay";
import { useIsXlUp } from "@/hooks/use-media-query";
import { useSupportsInlineVideo } from "@/hooks/use-supports-inline-video";
import { cn } from "@/lib/utils";

export interface FeatureCardProps {
  title: string;
  description: string;
  videoSrc: string;
  videoFallbackImg: string;
  videoDescription: string;
  /** Bare YouTube id of the same demo, played on the narrow layout. */
  youtubeVideoId: string;
  /**
   * Whether this is the carousel slide currently in view. Only the active card
   * mounts its YouTube player — see {@link AutoPlayYouTubeEmbed}.
   */
  isActive: boolean;
  /**
   * Used to build the video `data-testid`, e.g. `livePreview-demo-video`
   */
  translationKey: string;
  className?: string;
}

/**
 * A single marketing feature card: title, description and a demo video
 * inside a Mac OS like browser frame.
 *
 * The demo is the self-hosted MP4 on wide screens and the same clip on YouTube below
 * `xl`: YouTube serves a rendition sized for the device instead of the full-width MP4,
 * and it autoplays there, which is what the narrow layout used to ask for a tap for.
 * The two cannot be swapped with `hidden`/`xl:block` the way they were — an iframe in
 * a display-none container still loads the whole player — so this is a real branch.
 *
 * A wide screen on a browser that cannot play the MP4s inline (iOS 15 and desktop
 * Safari 15 and older) takes the YouTube path too. That used to be handled a level up,
 * by swapping the whole section for the "How it works" tutorials, because there was no
 * YouTube copy of each individual demo; there is one per feature now, so those visitors
 * get the same six cards as everyone else.
 */
export function FeatureCard({
  title,
  description,
  videoSrc,
  videoFallbackImg,
  videoDescription,
  youtubeVideoId,
  isActive,
  translationKey,
  className,
}: FeatureCardProps) {
  const testId = `${translationKey}-demo-video`;

  // `false` until the effect runs, so the first client render matches the server and
  // the narrow layout — the one that renders a still, not a player — is what hydrates
  const isXlUp = useIsXlUp();
  const canPlayInlineVideo = useSupportsInlineVideo();

  const showsYouTube = !isXlUp || !canPlayInlineVideo;

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-start gap-2 rounded-xl bg-white shadow-sm ring-1 ring-slate-200 sm:min-h-[465px] md:items-center md:rounded-2xl",
        className,
      )}
    >
      {/* text content */}
      <div className="max-w-[700px] flex-1 px-6 pb-4 pt-5 sm:px-8 sm:pb-4 sm:pt-6">
        <h3 className="text-balance pb-2 text-xl font-semibold leading-tight tracking-tight text-slate-900 sm:pb-4 sm:text-2xl">
          {title}
        </h3>
        <p className="text-pretty text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-7">
          {description}
        </p>
      </div>

      {/* video container */}
      <div className="relative w-full max-w-[800px]">
        {/* Mac OS Frame around the video */}
        <div className="relative overflow-hidden rounded-xl border border-b-0 border-l-0 border-r-0 border-slate-200 bg-white md:rounded-2xl">
          {/* Browser chrome bar */}
          <div className="h-8 w-full rounded-t-xl bg-gradient-to-b from-[#F3F3F3] to-[#E9E9E9] px-4 shadow-sm md:h-12 md:rounded-t-2xl">
            <div className="flex h-full items-center">
              <div className="flex space-x-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57] md:h-3 md:w-3"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E] md:h-3 md:w-3"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-[#28C840] md:h-3 md:w-3"></div>
              </div>
            </div>
          </div>
          {/* Video container */}
          <div className="relative aspect-[16.6/8.9] h-full w-full lg:aspect-[16.99/9.1]">
            {showsYouTube ? (
              /* The same demo from YouTube on mobile, tablet and old browsers */
              <AutoPlayYouTubeEmbed
                videoId={youtubeVideoId}
                title={videoDescription}
                posterImg={videoFallbackImg}
                isActive={isActive}
                testId={`${testId}-youtube`}
              />
            ) : (
              /* Self-hosted demo on desktop */
              <AutoPlayVideo
                src={videoSrc}
                posterImg={videoFallbackImg}
                description={videoDescription}
                testId={testId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
