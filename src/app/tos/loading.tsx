import { HeaderSkeleton } from "@/app/(components)/header/header-skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeaderSkeleton />

      <div className="container mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <div className="space-y-8">
          {/* Title */}
          <div className="h-9 w-56 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          {/* Effective date */}
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

          {/* Sections */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-px w-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              {i % 2 === 0 && (
                <div className="space-y-2 pl-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div
                      key={j}
                      className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                      style={{ width: `${75 + j * 5}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
