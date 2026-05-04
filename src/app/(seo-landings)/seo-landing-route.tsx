import { SeoLandingShell } from "@/app/(seo-landings)/components/seo-landing-shell";
import {
  SEO_LANDING_DEFINITIONS,
  type SeoLandingSlug,
} from "@/app/(seo-landings)/seo-landing-definitions";
import { APP_URL, STATIC_ASSETS_URL, TWITTER_CREATOR } from "@/config";
import type { Metadata } from "next";

export function buildSeoLandingMetadata(slug: SeoLandingSlug): Metadata {
  const definition = SEO_LANDING_DEFINITIONS[slug];

  if (!definition) {
    throw new Error(
      `🚨🚨🚨 [buildSeoLandingMetadata] SEO landing definition not found for slug: ${slug} 🚨🚨🚨`,
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

  return <SeoLandingShell definition={definition} />;
}
