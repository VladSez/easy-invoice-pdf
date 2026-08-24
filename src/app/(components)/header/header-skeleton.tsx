import { Skeleton } from "@/components/ui/skeleton";

/**
 * Header skeleton component for loading state.
 * Displays placeholder skeletons while the actual header content is loading.
 * Matches the layout and structure of the Header component.
 *
 * The outer chrome (sticky offset, pill container, ring and blur) is the real
 * header's, so only the contents fade in when the header itself is ready.
 */
export function HeaderSkeleton() {
  return (
    <header className="sticky top-4 z-50 w-full px-2 md:px-6">
      <div className="flex items-center justify-center">
        <div className="container h-16 rounded-3xl bg-gradient-to-r from-white/90 to-white/95 px-4 shadow-sm ring-1 ring-stone-200 backdrop-blur-md md:px-6">
          <div className="flex h-full items-center justify-between gap-4">
            {/* Placeholder for the app logo */}
            <div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <Skeleton className="size-6 rounded-lg md:size-7" />

                {/* Placeholder for app name and tagline on desktop */}
                <div className="hidden sm:block">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-5 w-[148px] lg:h-6 lg:w-[172px]" />
                    <Skeleton className="h-3 w-[196px] sm:w-[210px]" />
                  </div>
                </div>

                {/* Placeholder for app name on mobile (the tagline is hidden there) */}
                <div className="block sm:hidden">
                  <Skeleton className="h-5 w-[125px]" />
                </div>
              </div>
            </div>

            {/* Placeholders for the right side actions */}
            <div className="flex items-center gap-1">
              {/* Desktop nav: GitHub star pill, About, Changelog, Terms of Service */}
              <div className="hidden items-center justify-end gap-1 lg:flex">
                <Skeleton className="h-8 w-[156px] rounded-md" />
                <Skeleton className="h-8 w-[82px] rounded-md" />
                <Skeleton className="h-8 w-[92px] rounded-md" />
                <Skeleton className="h-8 w-[128px] rounded-md" />
              </div>

              {/* Language switcher -- desktop only */}
              <div className="hidden min-w-[36px] lg:block">
                <Skeleton className="size-9 rounded-full" />
              </div>

              {/* CTA button, which is tighter on mobile (`px-3 sm:px-8`) */}
              <Skeleton className="h-10 w-[116px] rounded-lg sm:w-[156px]" />

              {/* Mobile menu toggle */}
              <div className="relative lg:hidden">
                <Skeleton className="size-9 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
