"use client";

import { Suspense } from "react";

import { HowItWorksVideos } from "@/app/(main)/(app)/components/how-it-works-videos";
import { useSupportsInlineVideo } from "@/hooks/use-supports-inline-video";

import { type FeatureCardProps } from "./feature-card";
import { FeaturesCarousel } from "./features-carousel";

type Feature = Omit<FeatureCardProps, "className">;

interface FeaturesShowcaseProps {
  features: Feature[];
  translations: {
    /** Accessible name for the carousel region, e.g. "Product features" */
    label: string;
    previousFeature: string;
    nextFeature: string;
  };
}

/**
 * The features section body: the carousel of self-hosted demo videos, or — on
 * browsers that cannot play those inline — the YouTube tutorials plus the feature
 * copy on its own.
 *
 * The fallback is not a per-card swap because there is no YouTube equivalent of each
 * demo: the tutorials cover the app as a whole, so old browsers get four videos that
 * work instead of six that silently do not.
 */
export function FeaturesShowcase({
  features,
  translations,
}: FeaturesShowcaseProps) {
  const canPlayInlineVideo = useSupportsInlineVideo();

  if (canPlayInlineVideo) {
    return <FeaturesCarousel features={features} translations={translations} />;
  }

  return <FeaturesFallback features={features} />;
}

/**
 * `HowItWorksVideos` reads `?video=`, which needs a Suspense boundary of its own on
 * these statically rendered pages.
 */
function FeaturesFallback({ features }: { features: Feature[] }) {
  return (
    <div className="pt-10" data-testid="features-youtube-fallback">
      <div className="mx-auto max-w-[900px] overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 md:rounded-2xl">
        <Suspense fallback={null}>
          <HowItWorksVideos />
        </Suspense>
      </div>

      <ul className="mx-auto grid max-w-[900px] gap-4 px-4 pt-10 sm:grid-cols-2 sm:px-0">
        {features.map((feature) => {
          return (
            <li
              key={feature.translationKey}
              className="rounded-xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200"
            >
              <h3 className="text-balance pb-2 text-lg font-semibold leading-tight tracking-tight text-slate-900">
                {feature.title}
              </h3>
              <p className="text-pretty text-base leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
