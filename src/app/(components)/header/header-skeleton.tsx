import { Skeleton } from "@/components/ui/skeleton";

/**
 * Header skeleton component for loading state.
 * Displays placeholder skeletons while the actual header content is loading.
 * Matches the layout and structure of the Header component.
 */
export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="flex items-center justify-center">
        <div className="container h-auto px-4 py-2 sm:h-16 sm:py-0 md:px-6">
          <div className="flex h-full flex-row flex-wrap items-center justify-between gap-2">
            <div className="w-[53%] sm:w-auto">
              <div className="flex items-center gap-1.5 md:gap-2">
                {/* Placeholder for logo icon*/}
                <div className="flex items-center justify-center rounded-md">
                  <Skeleton className="size-6 md:size-7" />
                </div>
                {/* Placeholder for app name and description on desktop */}
                <div className="hidden sm:block">
                  <div className="flex flex-col space-y-1">
                    {/* Placeholder for app name */}
                    <Skeleton className="h-6 w-36 lg:w-40" />
                    {/* Placeholder for app description */}
                    <Skeleton className="mt-1.5 h-3 w-48 rounded" />
                  </div>
                </div>
                {/* Placeholder for app name on mobile */}
                <div className="block sm:hidden">
                  {/* Placeholder for app name on mobile*/}
                  <Skeleton className="h-7 w-28" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Placeholder for language switcher on desktop */}
              <Skeleton className="hidden h-9 w-[100px] rounded-md sm:block" />
              {/* Placeholder for language switcher on mobile */}
              <Skeleton className="h-9 w-9 rounded-md" />
              {/* Placeholder for go to app button */}
              <Skeleton className="h-9 min-w-[110px] max-w-[110px] rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
