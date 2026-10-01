import * as Sentry from "@sentry/nextjs";
import type { Metadata } from "next";
import { type ReactNode, Suspense } from "react";

import { fetchGithubStars } from "@/actions/fetch-github-stars";
import { Footer } from "@/app/(components)/footer";
import { getLatestChangelogSummary } from "@/app/(main)/changelog/utils";
import type { SupportedTemplates } from "@/app/schema";
import {
  APP_URL,
  PROD_WEBSITE_URL,
  STATIC_ASSETS_URL,
  TWITTER_CREATOR,
} from "@/config";
import { getIsIndexableEnvironment } from "@/lib/seo/indexing-utils";
import {
  HOME_PAGE_DESCRIPTION,
  HOME_PAGE_TITLE,
} from "@/lib/seo/site-entities";
import { STRIPE_TEMPLATE_PATHNAME } from "@/utils/invoice-app-url";

import { HomeSeoContent } from "./components/home-seo-content";
import { StripeTemplateSeoContent } from "./components/stripe-template-seo-content";
import { CTAToastProvider } from "./contexts/cta-toast-context";
import {
  HOME_WEB_PAGE,
  HomeJsonLd,
  type InvoiceAppWebPage,
} from "./home-json-ld";
import { InvoicePageLoadingSkeleton } from "./loading";
import { AppPageClient } from "./page.client";

/**
 * The invoice generator, shared by `/` (default template) and `/stripe-template`.
 *
 * Deliberately free of request-bound APIs (`searchParams`, `headers()`, `cookies()`), so
 * both routes are prerendered and revalidated in the background (every 4 hours, the
 * `fetchGithubStars` revalidate) instead of rendered per request. Everything that depends
 * on the URL -- the template, a shared `?data=` invoice -- is read on the client.
 */
export async function InvoiceAppPage({
  template,
}: {
  /** The template the route opens with. */
  template: SupportedTemplates;
}) {
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
      {isIndexableEnvironment ? (
        <HomeJsonLd webPage={TEMPLATE_WEB_PAGE[template]} />
      ) : null}
      {/* `AppPageClient` reads `useSearchParams()`, which a prerendered page can only
          resolve in the browser: the prerender falls back to the nearest Suspense boundary
          and renders the rest on the client. Without a boundary of its own that was
          `loading.tsx`, above everything here -- the JSON-LD was left out of the static
          HTML. The editor is client-only anyway (the invoice lives in localStorage or
          `?data=`), and the fallback is the skeleton `loading.tsx` renders. */}
      <Suspense fallback={<InvoicePageLoadingSkeleton template={template} />}>
        <AppPageClient
          githubStarsCount={githubStarsCount}
          latestChangelog={latestChangelog}
        />
      </Suspense>
      {TEMPLATE_SEO_CONTENT[template]}
      <Footer />
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
  const { title, description, canonical, images } = TEMPLATE_META[template];

  return {
    title,
    description,
    robots: resolveAppPageRobots(getIsIndexableEnvironment()),
    alternates: {
      canonical,
      types: {
        "text/markdown": `${APP_URL}/invoice-generator.md`,
      },
    },
    openGraph: {
      title,
      description,
      siteName: "EasyInvoicePDF.com | Free Invoice PDF Generator",
      locale: "en_US",
      type: "website",
      url: canonical,
      images: [...images],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

const TEMPLATE_META = {
  default: {
    title: HOME_PAGE_TITLE,
    description: HOME_PAGE_DESCRIPTION,
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
    // its own wording, so the route does not share `/`'s description
    description:
      "Free Stripe invoice template. Fill in a Stripe-style invoice, add your logo and a Pay online link, and download the PDF. No Stripe account, no signup.",
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
    description: string;
    canonical: string;
    images: NonNullable<Metadata["openGraph"]>["images"];
  }
>;

/**
 * The crawlable copy below the editor on each template's route. Each says something
 * different, so the two routes don't compete for the same queries.
 */
const TEMPLATE_SEO_CONTENT = {
  default: <HomeSeoContent />,
  stripe: <StripeTemplateSeoContent />,
} as const satisfies Record<SupportedTemplates, ReactNode>;

/** The `WebPage` JSON-LD node of each template's route. */
const TEMPLATE_WEB_PAGE = {
  default: HOME_WEB_PAGE,
  stripe: {
    url: `${PROD_WEBSITE_URL}${STRIPE_TEMPLATE_PATHNAME}`,
    name: TEMPLATE_META.stripe.title,
    description: TEMPLATE_META.stripe.description,
  },
} as const satisfies Record<SupportedTemplates, InvoiceAppWebPage>;
