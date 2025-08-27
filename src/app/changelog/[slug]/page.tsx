import { APP_URL, STATIC_ASSETS_URL } from "@/config";
import {
  formatChangelogDate,
  getChangelogEntry,
  getChangelogEntries,
  getNextChangelogEntry,
  getPreviousChangelogEntry,
} from "@/app/changelog/utils";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DateTime } from "../components/date-time";
import { BlackGoToAppButton } from "@/components/go-to-app-button-cta";

interface ChangelogPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all changelog entries
export async function generateStaticParams() {
  const entries = await getChangelogEntries();
  return entries.map((entry) => ({
    slug: entry.slug,
  }));
}

// Generate metadata for each changelog entry
export async function generateMetadata({
  params,
}: ChangelogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getChangelogEntry(slug);

  if (!entry) {
    throw new Error(`Changelog entry not found for slug: ${slug}`);
  }

  const formattedDate = formatChangelogDate(entry.metadata.date);

  return {
    title: `${entry.metadata.title || `Update ${formattedDate}`}`,
    description: `Changelog entry from ${formattedDate}`,
    authors: [{ name: "Vlad Sazonau", url: "https://x.com/vlad_sazon" }],
    alternates: {
      canonical: `https://easyinvoicepdf.com/changelog/${slug}`,
    },
    openGraph: {
      title: `${entry.metadata.title || `Update ${formattedDate}`}`,
      description: entry.metadata.description,
      type: "article",
      publishedTime: entry.metadata.date,
      siteName: `https://easyinvoicepdf.com/changelog/${slug}`,
      images: [
        {
          url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
          type: "image/png",
          width: 1200,
          height: 630,
          alt: "EasyInvoicePDF.com - Free Invoice Generator with Live PDF Preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${entry.metadata.title || `Update ${formattedDate}`} | Changelog`,
      description: entry.metadata.description,
      images: [
        {
          url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
          type: "image/png",
          width: 1200,
          height: 630,
          alt: "EasyInvoicePDF.com - Free Invoice Generator with Live PDF Preview",
        },
      ],
    },
  };
}

export default async function ChangelogEntryPage({
  params,
}: ChangelogPageProps) {
  const { slug } = await params;
  const entry = await getChangelogEntry(slug);

  if (!entry) {
    notFound();
  }

  const formattedDate = formatChangelogDate(entry.metadata.date);
  const [nextEntry, previousEntry] = await Promise.all([
    getNextChangelogEntry(slug),
    getPreviousChangelogEntry(slug),
  ]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Back to changelog link */}
        <div className="mb-8">
          <Link
            href="/changelog"
            className="group inline-flex items-center text-start text-base font-medium text-slate-700 dark:text-gray-400"
          >
            <ArrowLeftIcon className="inline-block size-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="ml-1">Back to All Posts</span>
          </Link>
        </div>

        {/* Entry header */}
        <article className="prose prose-gray max-w-none dark:prose-invert">
          <header className="not-prose mb-4 sm:mb-8">
            <div className="mb-4 flex items-center gap-3">
              <h1 className="text-pretty text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
                {entry.metadata.title || `Update ${formattedDate}`}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <DateTime dateTime={entry.metadata.date}>
                {formattedDate}
              </DateTime>
            </div>
          </header>

          {/* Author and social sharing */}
          <div className="my-4 flex flex-col justify-between sm:my-8 sm:flex-row sm:items-center">
            <div className="flex items-center gap-x-8">
              <div
                className="flex items-center space-x-3"
                data-testid="author-info-img"
              >
                <Link
                  href="https://x.com/vlad_sazon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Vlad Sazonau"
                    loading="lazy"
                    width="36"
                    height="36"
                    decoding="async"
                    className="rounded-full blur-0 transition-all group-hover:brightness-95"
                    src={
                      "https://pbs.twimg.com/profile_images/1927695477971030016/Dwloje_P_400x400.jpg"
                    }
                  />
                </Link>
                <div className="flex flex-col" data-testid="author-info-text">
                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-300">
                    Vlad Sazonau
                  </span>
                  <span className="text-sm text-slate-500 dark:text-neutral-400">
                    Founder,{" "}
                    <Link
                      href="/"
                      className="text-slate-500 no-underline hover:underline hover:underline-offset-2 dark:text-neutral-400"
                    >
                      {" "}
                      EasyInvoicePDF
                    </Link>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-x-6">
              {/* Twitter/X share */}
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="transition-all hover:scale-110"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `EasyInvoicePDF: ${entry.metadata.title || `Update ${formattedDate}`}`,
                )}&url=${encodeURIComponent(`${APP_URL}/changelog/${slug}`)}`}
              >
                <svg
                  width="300"
                  height="300"
                  viewBox="0 0 300 300"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-5 p-px text-black dark:text-white"
                >
                  <path
                    stroke="currentColor"
                    d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"
                  />
                </svg>
              </a>
              {/* LinkedIn share */}
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="transition-all hover:scale-110"
                href={`http://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                  `${APP_URL}/changelog/${slug}`,
                )}&title=${encodeURIComponent(`EasyInvoicePDF: ${entry.metadata.title || `Update ${formattedDate}`}`)}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="size-6 text-[#0077b5] dark:text-[#0077b5]"
                >
                  <path
                    fill="currentColor"
                    d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                  />
                </svg>
              </a>
              {/* Facebook share */}
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="transition-all hover:scale-110"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  `${APP_URL}/changelog/${slug}`,
                )}&title=${encodeURIComponent(`EasyInvoicePDF: ${entry.metadata.title || `Update ${formattedDate}`}`)}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1365.12"
                  height="1365.12"
                  viewBox="0 0 14222 14222"
                  className="size-6 text-[#1877f2] dark:text-[#1877f2]"
                >
                  <circle cx="7111" cy="7112" r="7111" fill="currentColor" />
                  <path
                    d="M9879 9168l315-2056H8222V5778c0-562 275-1111 1159-1111h897V2917s-814-139-1592-139c-1624 0-2686 984-2686 2767v1567H4194v2056h1806v4969c362 57 733 86 1111 86s749-30 1111-86V9168z"
                    fill="white"
                  />
                </svg>
              </a>
              {/* Hacker News share */}
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="transition-all hover:scale-110"
                href={`https://news.ycombinator.com/submitlink?u=${encodeURIComponent(
                  `${APP_URL}/changelog/${slug}`,
                )}&t=${encodeURIComponent(`EasyInvoicePDF: ${entry.metadata.title || `Update ${formattedDate}`}`)}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="size-6 text-[#ff6600] dark:text-[#ff6600]"
                >
                  <path
                    fill="currentColor"
                    d="M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434s-.297-.708-.651-1.434L8.831 5.896h-1.88z"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Entry content */}
          <div className="prose-headings:mt-8 prose-headings:font-semibold prose-headings:text-black prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-h5:text-base prose-h6:text-sm prose-p:text-gray-600 prose-blockquote:border-l-blue-500 prose-strong:text-gray-900 prose-code:rounded prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-pre:bg-gray-100 prose-li:text-gray-600 prose-img:rounded-lg prose-img:shadow-lg dark:prose-headings:text-white dark:prose-p:text-gray-300 dark:prose-strong:text-gray-100 dark:prose-code:bg-gray-800 dark:prose-pre:bg-gray-800 dark:prose-li:text-gray-300">
            <Suspense
              fallback={
                <div className="h-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              }
            >
              <entry.Component />
            </Suspense>
          </div>
        </article>

        {/* CTA Button */}
        <div
          className="mt-16 flex justify-center"
          data-testid="go-to-app-button-container"
        >
          <BlackGoToAppButton className="w-full py-6 text-lg">
            Go to App
          </BlackGoToAppButton>
        </div>

        {/* Previous and Next post navigation */}
        {(previousEntry || nextEntry) && (
          <div className="mt-16 border-t border-gray-200 pt-8 dark:border-gray-700">
            <div className="flex flex-row gap-8 sm:justify-between">
              {/* Previous post link */}
              {previousEntry ? (
                <Link
                  href={`/changelog/${previousEntry.slug}`}
                  className="group ml-2 flex-1 text-left sm:ml-10"
                >
                  <p className="flex items-center justify-end gap-1 text-sm font-medium text-slate-500 dark:text-gray-400 sm:text-base">
                    <ArrowLeftIcon className="inline-block size-4 transition-transform group-hover:-translate-x-0.5" />
                    Previous
                  </p>
                  <h3 className="mt-1 text-pretty text-end text-sm font-semibold text-gray-900 group-hover:underline dark:text-gray-100 sm:text-base">
                    {previousEntry.metadata.title ||
                      `Update ${formatChangelogDate(previousEntry.metadata.date)}`}
                  </h3>
                </Link>
              ) : (
                <div className="flex-1"></div>
              )}

              {/* Center divider */}
              <div className="block w-px self-stretch bg-gray-200 dark:bg-gray-700" />

              {/* Next post link */}
              {nextEntry ? (
                <Link
                  href={`/changelog/${nextEntry.slug}`}
                  className="group mr-2 flex-1 text-right sm:mr-10"
                >
                  <p className="flex items-center justify-start gap-1 text-sm font-medium text-slate-500 dark:text-gray-400 sm:text-base">
                    Next
                    <ArrowRightIcon className="inline-block size-4 transition-transform group-hover:translate-x-0.5" />
                  </p>
                  <h3 className="mt-1 text-pretty text-start text-sm font-semibold text-gray-900 group-hover:underline dark:text-gray-100 sm:text-base">
                    {nextEntry.metadata.title ||
                      `Update ${formatChangelogDate(nextEntry.metadata.date)}`}
                  </h3>
                </Link>
              ) : (
                <div className="flex-1"></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
