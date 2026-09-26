import { ArrowRightIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { HowItWorksVideos } from "@/app/(main)/(app)/components/how-it-works-videos";
import { HOW_IT_WORKS_VIDEOS } from "@/config";
import { cn } from "@/lib/utils";

/**
 * A 1px ring plus a soft drop shadow, both transparent, so a surface reads the same on
 * white and on a tinted background. Hairlines that divide rather than lift stay borders.
 */
const SURFACE_SHADOW = "shadow-sm ring-1 ring-black/[0.06]";

const SURFACE_SHADOW_HOVER = "hover:shadow-lg hover:ring-black/[0.08]";

const linkClassName =
  "font-medium text-slate-950 underline decoration-slate-400 underline-offset-2 transition-colors hover:text-slate-950/90 hover:decoration-slate-500";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] opacity-60 [background-size:22px_22px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_10%,transparent_75%)]"
        />

        <div className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center sm:px-6 md:pt-20">
          <h1
            className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl"
            data-testid="how-it-works-page-title"
          >
            How EasyInvoicePDF Works
          </h1>
          {/* Left-aligned until there is room to centre it: a paragraph this long is
              hard to read ragged on both sides at phone width. */}
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-left text-base leading-relaxed text-slate-600 sm:text-center">
            Learn how to create, customize, download, and share professional PDF
            invoices online with EasyInvoicePDF. These step-by-step videos show
            you how to use our{" "}
            <Link href="/" className={linkClassName}>
              free invoice generator
            </Link>
            , save seller and buyer details, add branding, set up VAT or your
            own tax label, and prepare weekly invoices. Whether you need an
            invoice maker for a one-off bill or a small business invoice
            template you can reuse, you can start in seconds.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-0 sm:px-6">
        <div
          id="player"
          className={cn(
            "overflow-hidden border-y border-slate-200 bg-white sm:rounded-2xl sm:border-0",
            SURFACE_SHADOW,
          )}
        >
          <Suspense fallback={<VideoPlayerSkeleton />}>
            <HowItWorksVideos />
          </Suspense>
        </div>
      </div>

      <section
        id="tutorials"
        className="mx-auto max-w-5xl px-4 pb-4 pt-16 sm:px-6"
        data-testid="how-it-works-tutorial-index"
      >
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            All tutorials
          </h2>
          <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-slate-600">
            Five minutes of video, start to finish. Pick the one you need.
          </p>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {HOW_IT_WORKS_VIDEOS.map((video, index) => {
            const watchHref = `/how-it-works?video=${video.id}#player`;

            return (
              <li key={video.id}>
                <section
                  id={video.id}
                  className={cn(
                    // Outer radius = inner radius + padding: 16 = 12 + 4.
                    "group flex h-full flex-col rounded-2xl bg-white p-1",
                    "transition-[box-shadow] duration-200 ease-out-strong",
                    SURFACE_SHADOW,
                    SURFACE_SHADOW_HOVER,
                  )}
                >
                  <Link href={watchHref} tabIndex={-1} aria-hidden>
                    <TutorialThumbnail
                      src={video.thumbnailUrl}
                      className="aspect-video w-full rounded-xl"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col p-4 pt-3.5">
                    <p className="text-xs font-semibold tabular-nums text-slate-400">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-1 text-base font-semibold tracking-tight text-slate-900">
                      <Link
                        href={watchHref}
                        className="rounded-sm outline-offset-4 transition-colors hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900"
                      >
                        {video.title}
                      </Link>
                    </h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">
                      {video.description}
                    </p>
                    <p className="mt-4 text-sm">
                      <Link href={watchHref} className={cn(linkClassName)}>
                        Watch tutorial
                      </Link>
                      {" · "}
                      <a
                        href={video.watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(linkClassName)}
                      >
                        Watch on YouTube
                      </a>
                    </p>
                  </div>
                </section>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-20 pt-14 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-12 text-center sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
          <p className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Ready to create your first invoice?
          </p>
          <p className="mx-auto mt-3 max-w-md text-pretty text-sm text-slate-300">
            No account, no ads. Your data stays in your browser.
          </p>
          <div className="mt-8">
            <StartInvoicingButton />
          </div>
        </div>
      </div>
    </main>
  );
}

interface TutorialThumbnailProps {
  src: string;
  className?: string;
}

/**
 * A YouTube thumbnail behind a play badge.
 *
 * Decorative: every one of these sits inside a link whose own text names the tutorial,
 * so the image adds nothing a screen reader needs to hear.
 */
function TutorialThumbnail({ src, className }: TutorialThumbnailProps) {
  return (
    <span
      className={cn("relative block overflow-hidden bg-slate-100", className)}
    >
      <img
        src={src}
        alt=""
        width={1280}
        height={720}
        loading="lazy"
        decoding="async"
        className={cn(
          // A neutral hairline, never a tinted one: a tinted outline picks up the
          // surface underneath and reads as dirt on the image edge.
          "h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10",
          "transition-transform duration-300 ease-out-strong motion-safe:group-hover:scale-[1.03]",
        )}
      />
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-slate-950/10 transition-colors duration-200 group-hover:bg-slate-950/20"
      >
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-full bg-white/95 shadow-sm",
            "transition-transform duration-200 ease-out-strong motion-safe:group-hover:scale-105",
          )}
        >
          {/* Triangles sit left of their optical centre; nudge the glyph right. */}
          <PlayIcon className="size-4 translate-x-px fill-slate-900 stroke-slate-900" />
        </span>
      </span>
    </span>
  );
}

/**
 * The page's single primary action. The arrow trails the label and moves only on
 * hover — an arrow that loops on its own charges attention on every visit.
 */
function StartInvoicingButton() {
  return (
    <Link
      href="/"
      className={cn(
        // The icon side takes 2px less padding than the text side, so the arrow does
        // not look pushed against the edge.
        "group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white pe-[30px] ps-8 text-base font-medium text-slate-900",
        // Press feedback: never below 0.95, which reads as a bounce rather than a press.
        "transition-[background-color,transform] duration-150 ease-out-strong hover:bg-slate-100 active:scale-[0.96]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
      )}
    >
      <span>Start Invoicing</span>
      <ArrowRightIcon
        className="size-5 transition-transform duration-200 ease-out-strong motion-safe:group-hover:translate-x-1"
        strokeWidth={2}
        aria-hidden
      />
    </Link>
  );
}

function VideoPlayerSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-16 border-b border-slate-200 px-6 py-4" />
      <div className="aspect-video bg-slate-100" />
      <div className="h-14 border-t border-slate-200" />
    </div>
  );
}
