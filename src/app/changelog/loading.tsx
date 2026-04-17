export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="relative z-0">
        {/* Hero */}
        <div className="relative mb-8 pt-16 text-center sm:mb-16">
          <div className="absolute bottom-0 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] sm:bottom-auto" />
          <div className="relative z-10 mx-auto h-10 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700 sm:h-12 sm:w-64" />
          <div className="relative z-10 mx-auto mt-4 h-5 w-72 animate-pulse rounded bg-gray-200 dark:bg-gray-700 sm:w-96" />
        </div>

        {/* Timeline Grid */}
        <div className="border-slate-200 sm:border-t">
          <div className="mx-auto max-w-6xl border-slate-200 px-4 dark:border-gray-700 sm:px-12 xl:border-x">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid pb-20 pt-4 sm:pt-12 md:grid-cols-4">
                {/* Date column - desktop */}
                <div className="sticky top-28 hidden self-start md:col-span-1 md:mt-[6px] md:block">
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Content column */}
                <div className="flex flex-col md:col-span-3">
                  {/* Date - mobile */}
                  <div className="mb-3 h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700 md:hidden" />

                  {/* Title */}
                  <div className="mt-2 h-7 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700 sm:mt-0" />

                  {/* Version badge */}
                  <div className="mt-2 h-5 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />

                  {/* Author byline */}
                  <div className="mb-2 mt-4 flex items-center gap-2">
                    <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </div>

                  {/* Article content */}
                  <div className="space-y-3">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="mt-4 space-y-2 pl-4">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div
                          key={j}
                          className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                          style={{ width: `${80 - j * 8}%` }}
                        />
                      ))}
                    </div>
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
