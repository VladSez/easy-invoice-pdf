"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState, useSyncExternalStore } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

import { FeatureCard, type FeatureCardProps } from "./feature-card";

interface FeaturesCarouselProps {
  features: Omit<FeatureCardProps, "className">[];
  translations: {
    /** Accessible name for the carousel region, e.g. "Product features" */
    label: string;
    previousFeature: string;
    nextFeature: string;
  };
}

/** Used while embla has no api yet: there is nothing to unsubscribe from */
const noop = () => {
  return undefined;
};

/**
 * Carousel with the marketing feature demos: one card per view on mobile,
 * two per view from `lg` up (same as the grid it replaced).
 *
 * Loops, so the previous/next buttons stay enabled and wrap around at both ends.
 */
export function FeaturesCarousel({
  features,
  translations,
}: FeaturesCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();

  // The embla instance owns the selected slide, so read it straight from the
  // carousel rather than mirroring it into state. `setApi` re-renders once the
  // instance exists, which is when the snapshot below starts returning it.
  const subscribeToSelectedIndex = useCallback(
    (onStoreChange: () => void) => {
      // there is nothing to subscribe to until embla hands over its api
      if (!api) {
        return noop;
      }

      api.on("select", onStoreChange);
      api.on("reInit", onStoreChange);

      return () => {
        api.off("select", onStoreChange);
        api.off("reInit", onStoreChange);
      };
    },
    [api],
  );

  const selectedIndex = useSyncExternalStore(
    subscribeToSelectedIndex,
    () => {
      return api?.selectedScrollSnap() ?? 0;
    },
    // the carousel only exists on the client, so the first slide is always selected on the server
    () => {
      return 0;
    },
  );

  const scrollTo = useCallback(
    (index: number) => {
      return api?.scrollTo(index);
    },
    [api],
  );

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true, align: "start" }}
      aria-label={translations.label}
      className="pt-10 sm:px-4 lg:px-0"
      data-testid="features-carousel"
    >
      {/* The negative margins cancel the `p-2` of the carousel viewport plus each slide's
          own gutter, so the cards run edge to edge on mobile, and from `sm` up they open
          the gutter between slides. On mobile `-ml-6` = 8px (viewport padding) + 16px
          (the slide's `pl-4`), which parks the gutter off-screen: a card still fills the
          full width at rest, and the 16px only becomes visible mid-swipe, between cards.
          Cards stretch to the tallest one at every breakpoint, so swiping never changes
          the height of the carousel. */}
      <CarouselContent className="-ml-6 -mr-2 items-stretch sm:-ml-4 sm:mr-0 lg:-ml-6 xl:-ml-10">
        {features.map((feature) => {
          return (
            <CarouselItem
              key={feature.translationKey}
              // one card per view on mobile, two from `lg` up. Mobile takes the full
              // width so the demo video is as large as it can be; the arrows and dots
              // below carry the "there is more" affordance that the peeking card did.
              // The `pl-4` that `CarouselItem` hardcodes is the gutter between cards; the
              // track's `-ml-6` pulls it off-screen so it only shows while scrolling
              className="basis-full sm:basis-[70%] md:basis-[55%] lg:basis-1/2 lg:pl-6 xl:pl-10"
            >
              <FeatureCard {...feature} />
            </CarouselItem>
          );
        })}
      </CarouselContent>

      {/* Controls: previous/next arrows and one dot per feature */}
      <div className="flex items-center justify-center gap-2 pt-6 lg:gap-4">
        <button
          type="button"
          aria-label={translations.previousFeature}
          onClick={() => {
            return api?.scrollPrev();
          }}
          className={arrowButtonClassName}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <div role="group" className="flex items-center gap-2">
          {features.map((feature, index) => {
            return (
              <button
                key={feature.translationKey}
                type="button"
                // the feature title keeps the label localized, unlike a hardcoded "Go to slide N"
                aria-label={feature.title}
                aria-current={index === selectedIndex}
                onClick={() => {
                  return scrollTo(index);
                }}
                className="rounded-full p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "block size-2 rounded-full bg-slate-300 transition-colors",
                    index === selectedIndex && "bg-slate-900",
                  )}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label={translations.nextFeature}
          onClick={() => {
            return api?.scrollNext();
          }}
          className={arrowButtonClassName}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>
    </Carousel>
  );
}

const arrowButtonClassName = cn(
  "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors",
  "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
  "active:scale-[98%] active:transition-transform",
);
