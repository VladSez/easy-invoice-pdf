import type { Metadata } from "next";

import { SeoLandingShell } from "@/app/(main)/(seo-landings)/components/seo-landing-shell";
import {
  SEO_LANDING_DEFINITIONS,
  type SeoLandingSlug,
} from "@/app/(main)/(seo-landings)/seo-landing-definitions";
import {
  APP_URL,
  OG_VIDEO,
  STATIC_ASSETS_URL,
  STRIPE_OG_VIDEO,
  TWITTER_CREATOR,
} from "@/config";

/** Landings about the Stripe template show its video; the rest show the default one. */
const OG_VIDEO_BY_SLUG: Partial<
  Record<SeoLandingSlug, typeof STRIPE_OG_VIDEO>
> = {
  "stripe-invoice-alternative": STRIPE_OG_VIDEO,
};

export function buildSeoLandingMetadata(slug: SeoLandingSlug): Metadata {
  const definition = SEO_LANDING_DEFINITIONS[slug];

  if (!definition) {
    throw new Error(
      `\n\n🚨🚨🚨 [buildSeoLandingMetadata] SEO landing definition not found for slug: ____${slug}____ 🚨🚨🚨\n\n`,
    );
  }

  const pageUrl = `${APP_URL}/${definition.slug}`;

  const ogImage = `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`;

  return {
    title: definition.metadata.title,
    description: definition.metadata.description,
    keywords: definition.metadata.keywords,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: definition.metadata.title,
      description: definition.metadata.description,
      siteName: "EasyInvoicePDF.com | Free Invoice Generator",
      locale: "en_US",
      type: "website",
      url: pageUrl,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: "EasyInvoicePDF.com - Free Invoice PDF Generator",
        },
      ],
      videos: [OG_VIDEO_BY_SLUG[slug] ?? OG_VIDEO],
    },
    twitter: {
      card: "summary_large_image",
      title: definition.metadata.title,
      description: definition.metadata.description,
      creator: TWITTER_CREATOR,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: "EasyInvoicePDF.com - Free Invoice PDF Generator",
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

export function SeoLandingRoutePage({ slug }: { slug: SeoLandingSlug }) {
  const definition = SEO_LANDING_DEFINITIONS[slug];

  if (!definition) {
    throw new Error(
      `\n\n🚨🚨🚨 [SeoLandingRoutePage] SEO landing definition not found for slug: ____${slug}____ 🚨🚨🚨\n\n`,
    );
  }

  return <SeoLandingShell definition={definition} />;
}
