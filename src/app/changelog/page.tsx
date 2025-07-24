import {
  formatChangelogDate,
  getChangelogEntries,
  type ChangelogEntry,
} from "@/app/changelog/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DateTime } from "./components/date-time";

// Enable static generation for this page
export const dynamic = "force-static";

// https://nextjs.org/docs/app/guides/mdx
export default async function ChangelogPage() {
  const entries = await getChangelogEntries();

  if (entries.length === 0) {
    notFound();
  }

  return (
    <div className={`
      min-h-screen bg-white
      dark:bg-gray-900
    `}>
      <div className="relative z-0">
        <div className={`
          relative mb-8 pt-16 text-center
          sm:mb-16
        `}>
          <div className={`
            absolute bottom-0 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]
            mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]
            bg-size-[16px_16px]
            sm:bottom-auto
          `}></div>
          <h1 className={`
            relative z-10 text-4xl font-bold tracking-tight text-gray-900
            sm:text-5xl
            dark:text-gray-100
          `}>
            Changelog
          </h1>
          <p className={`
            relative z-10 mt-4 px-4 text-lg text-balance text-gray-600
            sm:px-0
            dark:text-gray-400
          `}>
            All the latest updates, improvements, and fixes to EasyInvoicePDF
          </p>
        </div>

        {/* Timeline Grid */}
        <div className={`
          border-slate-200
          sm:border-t
        `}>
          <div className={`
            mx-auto max-w-6xl border-slate-200 px-4
            sm:px-12
            xl:border-x
            dark:border-gray-700
          `}>
            {entries.map((entry) => (
              <ChangelogEntryCard key={entry.slug} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangelogEntryCard({ entry }: { entry: ChangelogEntry }) {
  const formattedDate = formatChangelogDate(entry.metadata.date);

  return (
    <div className={`
      grid pt-4 pb-20
      sm:pt-12
      md:grid-cols-4
    `}>
      {/* Sticky Date Column - Desktop Only */}
      <div className={`
        sticky top-28 hidden self-start
        md:col-span-1 md:block
      `}>
        <Link href={`/changelog/${entry.slug}`}>
          <DateTime dateTime={entry.metadata.date}>{formattedDate}</DateTime>
        </Link>
      </div>

      {/* Content Column */}
      <div className={`
        flex flex-col
        md:col-span-3
      `}>
        {/* Mobile Date - Above Title */}
        <Link className={`
          mb-3
          md:hidden
        `} href={`/changelog/${entry.slug}`}>
          <DateTime dateTime={entry.metadata.date}>{formattedDate}</DateTime>
        </Link>

        {/* Title */}
        <Link href={`/changelog/${entry.slug}`}>
          <h2 className={`
            mt-2 text-2xl font-semibold tracking-tight text-pretty text-gray-800
            hover:underline hover:decoration-1 hover:underline-offset-4
            sm:mt-0
            dark:text-gray-100
          `}>
            {entry.metadata.title || `Update ${formattedDate}`}
          </h2>
        </Link>

        {/* Article Content */}
        <article
          data-testid="changelog-entry-card"
          className={`
            prose max-w-none transition-all prose-gray
            dark:prose-invert
            prose-headings:relative prose-headings:mt-6 prose-headings:mb-4
            prose-headings:scroll-mt-20 prose-headings:font-semibold prose-headings:text-gray-900
            dark:prose-headings:text-gray-100
            prose-h1:text-2xl
            prose-h2:text-xl
            prose-h3:text-lg
            prose-h4:text-base
            prose-p:leading-relaxed prose-p:text-gray-600
            dark:prose-p:text-gray-300
            prose-a:font-medium prose-a:text-gray-500 prose-a:underline-offset-4
            hover:prose-a:text-black
            dark:prose-a:text-blue-400
            prose-strong:text-gray-900
            dark:prose-strong:text-gray-100
            prose-code:rounded prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5
            prose-code:text-sm
            dark:prose-code:bg-gray-800
            prose-pre:border prose-pre:border-gray-200 prose-pre:bg-gray-100
            dark:prose-pre:border-gray-700 dark:prose-pre:bg-gray-800
            prose-li:text-gray-600
            dark:prose-li:text-gray-300
            prose-img:rounded-lg prose-img:border prose-img:border-gray-200 prose-img:shadow-md
            dark:prose-img:border-gray-700
          `}
        >
          <Suspense
            fallback={
              <div className={`
                h-32 animate-pulse rounded bg-gray-200
                dark:bg-gray-700
              `}></div>
            }
          >
            <entry.Component />
          </Suspense>
        </article>
      </div>
    </div>
  );
}
