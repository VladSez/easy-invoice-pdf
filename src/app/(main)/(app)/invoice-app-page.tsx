import * as Sentry from "@sentry/nextjs";
import type { Metadata } from "next";

import { fetchGithubStars } from "@/actions/fetch-github-stars";
import { getLatestChangelogSummary } from "@/app/(main)/changelog/utils";
import type { SupportedTemplates } from "@/app/schema";
import { APP_URL, STATIC_ASSETS_URL, TWITTER_CREATOR } from "@/config";
import { getIsIndexableEnvironment } from "@/lib/seo/indexing-utils";
import { STRIPE_TEMPLATE_PATHNAME } from "@/utils/invoice-app-url";

import { CTAToastProvider } from "./contexts/cta-toast-context";
import { HomeJsonLd } from "./home-json-ld";
import { AppPageClient } from "./page.client";

/**
 * The invoice generator, shared by `/` (default template) and `/stripe-template`.
 *
 * Deliberately free of request-bound APIs (`searchParams`, `headers()`, `cookies()`), so
 * both routes are prerendered and revalidated in the background (every 4 hours, the
 * `fetchGithubStars` revalidate) instead of rendered per request. Everything that depends
 * on the URL -- the template, a shared `?data=` invoice -- is read on the client.
 */
export async function InvoiceAppPage() {
  const isIndexableEnvironment = getIsIndexableEnvironment();

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
      {isIndexableEnvironment ? <HomeJsonLd /> : null}
      <AppPageClient
        githubStarsCount={githubStarsCount}
        latestChangelog={latestChangelog}
      />
    </CTAToastProvider>
  );
}

/**
 * Builds the metadata of the invoice app route for a template: title, canonical URL,
 * OpenGraph/Twitter cards and robots directives.
 *
 * @param template - The template the route opens with.
 * @returns Static Next.js metadata for the route.
 */
export function buildInvoiceAppMetadata(
  template: SupportedTemplates,
): Metadata {
  const { title, canonical, images } = TEMPLATE_META[template];

  return {
    title,
    description: APP_PAGE_DESCRIPTION,
    robots: resolveAppPageRobots(getIsIndexableEnvironment()),
    alternates: {
      canonical,
      types: {
        "text/markdown": `${APP_URL}/invoice-generator.md`,
      },
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
 * Resolves `robots` metadata for the invoice app routes.
 *
 * Indexing is allowed only on an indexable environment (production deploy). Preview
 * builds use strict `noindex,nofollow`. Shared `?data=` links are handled outside the
 * prerendered metadata, see `getIsIndexableEnvironment`.
 *
 * @param isIndexableEnvironment - Whether this deployment may be indexed.
 * @returns Next.js `Metadata.robots` object for this page.
 */
function resolveAppPageRobots(
  isIndexableEnvironment: boolean,
): NonNullable<Metadata["robots"]> {
  return {
    index: isIndexableEnvironment,
    follow: isIndexableEnvironment,
    googleBot: {
      index: isIndexableEnvironment,
      follow: isIndexableEnvironment,
    },
  };
}

const APP_PAGE_DESCRIPTION =
  "Create professional PDF invoices online for free. Customize invoice templates, add your logo, download instantly, and send invoices without signup.";

const TEMPLATE_META = {
  default: {
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
  },
  stripe: {
    title: "Stripe Invoice Template - Create Free PDF Invoice",
    canonical: `${APP_URL}${STRIPE_TEMPLATE_PATHNAME}`, // its own route, so the Stripe template is indexed as its own page
    images: [
      {
        url: `${STATIC_ASSETS_URL}/stripe-og.png?v=1755773921680`,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "Stripe Invoice Template - EasyInvoicePDF.com",
      },
    ],
  },
} as const satisfies Record<
  SupportedTemplates,
  {
    title: string;
    canonical: string;
    images: NonNullable<Metadata["openGraph"]>["images"];
  }
>;
