"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    function syncSelectedIndex(carouselApi: CarouselApi) {
      if (carouselApi) setSelectedIndex(carouselApi.selectedScrollSnap());
    }

    syncSelectedIndex(api);
    api.on("select", syncSelectedIndex);
    api.on("reInit", syncSelectedIndex);

    return () => {
      api.off("select", syncSelectedIndex);
      api.off("reInit", syncSelectedIndex);
    };
  }, [api]);

  const scrollTo = useCallback((index: number) => api?.scrollTo(index), [api]);

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true, align: "start" }}
      aria-label={translations.label}
      className="pt-10 sm:px-4 lg:px-0"
      data-testid="features-carousel"
    >
      {/* The negative margins cancel the `p-2` of the carousel viewport so the cards
          run edge to edge on mobile, and from `sm` up they open the gutter between slides.
          Cards stretch to the tallest one at every breakpoint, so swiping never changes
          the height of the carousel. */}
      <CarouselContent className="-ml-2 -mr-2 items-stretch sm:-ml-4 sm:mr-0 lg:-ml-6 xl:-ml-10">
        {features.map((feature) => (
          <CarouselItem
            key={feature.translationKey}
            // one card per view on mobile, two from `lg` up. Mobile takes the full
            // width so the demo video is as large as it can be; the arrows and dots
            // below carry the "there is more" affordance that the peeking card did.
            // `pl-0` drops the `pl-4` that `CarouselItem` hardcodes, so mobile cards
            // have no side padding at all
            className="basis-full pl-0 sm:basis-[70%] sm:pl-4 md:basis-[55%] lg:basis-1/2 lg:pl-6 xl:pl-10"
          >
            <FeatureCard {...feature} />
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* Controls: previous/next arrows and one dot per feature */}
      <div className="flex items-center justify-center gap-2 pt-6 lg:gap-4">
        <button
          type="button"
          aria-label={translations.previousFeature}
          onClick={() => api?.scrollPrev()}
          className={arrowButtonClassName}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <div role="group" className="flex items-center gap-2">
          {features.map((feature, index) => (
            <button
              key={feature.translationKey}
              type="button"
              // the feature title keeps the label localized, unlike a hardcoded "Go to slide N"
              aria-label={feature.title}
              aria-current={index === selectedIndex}
              onClick={() => scrollTo(index)}
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
          ))}
        </div>

        <button
          type="button"
          aria-label={translations.nextFeature}
          onClick={() => api?.scrollNext()}
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
