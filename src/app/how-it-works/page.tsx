import { HowItWorksVideos } from "@/app/(app)/components/how-it-works-videos";
import { HOW_IT_WORKS_VIDEOS } from "@/config";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-static";

function VideoPlayerSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse rounded-lg border border-slate-200 bg-white">
      <div className="h-16 border-b border-slate-200 px-6 py-4" />
      <div className="aspect-video bg-slate-100" />
      <div className="h-14 border-t border-slate-200" />
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <div
        data-info="blur-transition-overlay"
        className="pointer-events-none absolute left-0 right-0 top-[25px] h-24 bg-gradient-to-b from-slate-100 to-slate-50 blur-2xl"
      />
      <div className="relative z-0">
        <div className="relative mb-8 pt-16 text-center sm:mb-12">
          <div className="absolute bottom-0 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] sm:bottom-auto" />
          <h1
            className="relative z-10 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl"
            data-testid="how-it-works-page-title"
          >
            How EasyInvoicePDF Works
          </h1>
          <p className="relative z-10 mx-auto mt-4 max-w-2xl text-balance px-4 text-sm text-gray-600 sm:px-0 md:text-lg">
            Discover how to create, customize, and send professional PDF
            invoices online with EasyInvoicePDF. Watch step-by-step tutorial
            videos to learn invoice creation, branding, and customization tips.
            Start generating invoices instantly in our{" "}
            <Link
              href="/"
              className="font-medium text-slate-800 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-950 hover:decoration-slate-500"
            >
              free online invoice generator
            </Link>
            .
          </p>
        </div>

        <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <Suspense fallback={<VideoPlayerSkeleton />}>
            <HowItWorksVideos />
          </Suspense>
        </div>

        <section
          id="tutorials"
          className="mx-auto mt-12 max-w-3xl px-4 pb-16 sm:px-0"
          data-testid="how-it-works-tutorial-index"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            All tutorials
          </h2>
          <ul className="mt-6 space-y-8">
            {HOW_IT_WORKS_VIDEOS.map((video) => (
              <li key={video.id}>
                <section id={video.id}>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {video.title}
                  </h3>
                  <p className="mt-2 text-gray-600">{video.description}</p>
                  <p className="mt-3">
                    <Link
                      href={`/how-it-works?video=${video.id}`}
                      className="font-medium text-slate-800 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-950 hover:decoration-slate-500"
                    >
                      Watch tutorial
                    </Link>
                    {" · "}
                    <a
                      href={video.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-slate-800 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-950 hover:decoration-slate-500"
                    >
                      Watch on YouTube
                    </a>
                  </p>
                </section>
              </li>
            ))}
          </ul>
        </section>

        <div className="border-t border-slate-200 bg-slate-50 py-14 text-center">
          <p className="text-wrap-balance text-lg font-medium text-gray-700">
            Ready to create your first invoice?
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-base text-white shadow transition-colors will-change-transform hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 focus-visible:ring-offset-2 active:scale-95"
            data-testid="how-it-works-cta"
          >
            <span aria-hidden="true">Open invoice generator</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
