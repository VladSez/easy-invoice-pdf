import { AutoPlayVideo, ManualPlayVideo } from "@/components/video";
import { cn } from "@/lib/utils";

export interface FeatureCardProps {
  title: string;
  description: string;
  videoSrc: string;
  videoFallbackImg: string;
  videoDescription: string;
  /**
   * Used to build the video `data-testid`, e.g. `livePreview-demo-video`
   */
  translationKey: string;
  className?: string;
}

/**
 * A single marketing feature card: title, description and a demo video
 * inside a Mac OS like browser frame.
 */
export function FeatureCard({
  title,
  description,
  videoSrc,
  videoFallbackImg,
  videoDescription,
  translationKey,
  className,
}: FeatureCardProps) {
  const testId = `${translationKey}-demo-video`;

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
            {/* Auto play video for desktop */}
            <AutoPlayVideo
              className="hidden xl:block"
              src={videoSrc}
              posterImg={videoFallbackImg}
              description={videoDescription}
              testId={testId}
            />
            {/* Manual play video for mobile for better UX */}
            <ManualPlayVideo
              className="xl:hidden"
              src={videoSrc}
              posterImg={videoFallbackImg}
              description={videoDescription}
              testId={testId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
