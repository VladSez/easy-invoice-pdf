import type { Metadata } from "next";
import { AppPageClient } from "./page.client";
import { APP_URL, STATIC_ASSETS_URL, TWITTER_CREATOR } from "@/config";
import { fetchGithubStars } from "@/actions/fetch-github-stars";
import { getLatestChangelogSummary } from "@/app/changelog/utils";
import { CTAToastProvider } from "./contexts/cta-toast-context";
import { HomeJsonLd } from "./home-json-ld";
import { computeIndexingFlags } from "@/lib/seo/indexing-utils";
import * as Sentry from "@sentry/nextjs";

const APP_PAGE_DESCRIPTION =
  "Create professional PDF invoices online for free. Customize invoice templates, add your logo, download instantly, and send invoices without signup.";

const DEFAULT_TEMPLATE_META = {
  title: "Free Invoice Generator - Create PDF Invoices Online",
  canonical: `${APP_URL}/`, // we use root URL as canonical for SEO purposes
  images: [
    {
      url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
      type: "image/png",
      width: 1200,
      height: 630,
      alt: "Default Invoice Template - EasyInvoicePDF.com",
    },
  ],
} as const satisfies {
  title: string;
  canonical: string;
  images: NonNullable<Metadata["openGraph"]>["images"];
};

const STRIPE_TEMPLATE_META = {
  title: "Stripe Invoice Template - Create Free PDF Invoice",
  canonical: `${APP_URL}/`, // we use root URL as canonical for SEO purposes
  images: [
    {
      url: `${STATIC_ASSETS_URL}/stripe-og.png?v=1755773921680`,
      width: 1200,
      height: 630,
      alt: "Stripe Invoice Template - EasyInvoicePDF.com",
    },
  ],
} as const satisfies {
  title: string;
  canonical: string;
  images: NonNullable<Metadata["openGraph"]>["images"];
};

/**
 * Builds complete metadata object for invoice app templates.
 *
 * Constructs OpenGraph and Twitter metadata for template variants
 * (default and Stripe), including title, description, canonical URL,
 * and OG image specifications.
 *
 * @param meta - Template metadata object containing title, canonical URL, and OG images
 * @returns Next.js Metadata object with OpenGraph and Twitter cards configured
 */
function buildTemplateMetadata(
  meta: typeof DEFAULT_TEMPLATE_META | typeof STRIPE_TEMPLATE_META,
): Metadata {
  const { title, canonical, images } = meta;

  return {
    title,
    description: APP_PAGE_DESCRIPTION,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description: APP_PAGE_DESCRIPTION,
      siteName: "EasyInvoicePDF.com | Free Invoice PDF Generator",
      locale: "en_US",
      type: "website",
      url: canonical,
      images: [...images],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: APP_PAGE_DESCRIPTION,
      creator: TWITTER_CREATOR,
      images: [...images],
    },
  };
}

/**
 * Resolves `robots` metadata for the main invoice app URL (`/`).
 *
 * Indexing is allowed only when `shouldIndex` is true (production deploy,
 * no shareable `?data=` payload). Otherwise behavior depends on template:
 * Stripe template URLs use `noindex` but `follow` so crawlers may discover links
 * without indexing a duplicate variant; all other non-indexable cases use strict
 * `noindex,nofollow` (including preview builds and share links).
 *
 * @param shouldIndex - Whether this response should be treated as the canonical indexable homepage.
 * @param isStripeTemplate - Whether `template=stripe` is active (affects fallback when not indexable).
 * @returns Next.js `Metadata.robots` object for this page.
 */
function resolveAppPageRobots(
  shouldIndex: boolean,
): NonNullable<Metadata["robots"]> {
  if (shouldIndex) {
    return {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    };
  }

  const strictNoIndexNoFollow = {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  } as const satisfies NonNullable<Metadata["robots"]>;

  // if we have shareable data, we don't want to index the page
  // or on non-production environments
  return strictNoIndexNoFollow;
}

// we generate metadata here, because we need access to searchParams (in layout we don't have it)
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const { shouldIndex } = computeIndexingFlags(searchParams);
  const isStripeTemplate = Boolean(searchParams?.template === "stripe");

  const templateMetadata = buildTemplateMetadata(
    isStripeTemplate ? STRIPE_TEMPLATE_META : DEFAULT_TEMPLATE_META,
  );

  const robots = resolveAppPageRobots(shouldIndex);

  return {
    robots,
    ...templateMetadata,
  };
}

export default async function AppPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { shouldIndex } = computeIndexingFlags(searchParams);

  const [githubStarsCount, latestChangelog] = await Promise.all([
    fetchGithubStars(),
    getLatestChangelogSummary().catch((error) => {
      // don't fail the page if we can't load the latest changelog summary
      console.error("[AppPage] Failed to load latest changelog summary", error);

      Sentry.captureException(
        new Error(
          `[AppPage] Failed to load latest changelog summary: ${error}`,
        ),
      );

      return null;
    }),
  ]);

  return (
    <CTAToastProvider>
      {shouldIndex ? <HomeJsonLd /> : null}
      <AppPageClient
        githubStarsCount={githubStarsCount}
        latestChangelog={latestChangelog}
      />
    </CTAToastProvider>
  );
}
