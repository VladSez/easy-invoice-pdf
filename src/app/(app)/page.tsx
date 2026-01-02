import type { Metadata } from "next";
import { AppPageClient } from "./page.client";
import { APP_URL, STATIC_ASSETS_URL } from "@/config";
import { fetchGithubStars } from "@/actions/fetch-github-stars";
import { CTAToastProvider } from "./contexts/cta-toast-context";

// we generate metadata here, because we need access to searchParams (in layout we don't have it)
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const hasShareableData = Boolean(searchParams?.data);
  const isStripeTemplate = Boolean(searchParams?.template === "stripe");

  const isProd =
    process.env.VERCEL_ENV === "production" &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` ===
      "https://easyinvoicepdf.com";

  const defaultRobotsConfig = {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  };

  // Only allow indexing on production and when there's no shareable data
  const shouldIndex = isProd && !hasShareableData;

  return {
    robots: shouldIndex
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
          },
        }
      : defaultRobotsConfig,
    ...(isStripeTemplate
      ? {
          // stripe template
          alternates: {
            canonical: `${APP_URL}/?template=stripe`,
          },
          openGraph: {
            title: "Stripe Template — Create Invoice | EasyInvoicePDF",
            description:
              "Create and download professional invoices instantly with EasyInvoicePDF.com. Free and open-source. No signup required.",
            siteName: "EasyInvoicePDF.com | Free Invoice Generator",
            locale: "en_US",
            type: "website",
            url: `${APP_URL}/?template=stripe`,
            images: [
              {
                url: `${STATIC_ASSETS_URL}/stripe-og.png?v=1755773921680`,
                width: 1200,
                height: 630,
                alt: "Stripe Invoice Template",
              },
            ],
          },
          twitter: {
            card: "summary_large_image",
            title: "Stripe Template — Create Invoice | EasyInvoicePDF",
            description:
              "Create and download professional invoices instantly with EasyInvoicePDF.com. Free and open-source. No signup required.",
            creator: "@vlad_sazon",
            images: [
              {
                url: `${STATIC_ASSETS_URL}/stripe-og.png?v=1755773921680`,
                width: 1200,
                height: 630,
                alt: "Stripe Invoice Template",
              },
            ],
          },
        }
      : {
          // default template
          alternates: {
            canonical: `${APP_URL}/?template=default`,
          },
          openGraph: {
            title: "Create Invoice — EasyInvoicePDF",
            description:
              "Create and download professional invoices instantly with EasyInvoicePDF.com. Free and open-source. No signup required.",
            siteName: "EasyInvoicePDF.com | Free Invoice Generator",
            locale: "en_US",
            type: "website",
            url: `${APP_URL}/?template=default`,
            images: [
              {
                url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
                type: "image/png",
                width: 1200,
                height: 630,
                alt: "EasyInvoicePDF.com - Free Invoice Generator with Live PDF Preview",
              },
            ],
          },
          twitter: {
            card: "summary_large_image",
            title: "Create Invoice — EasyInvoicePDF",
            description:
              "Create and download professional invoices instantly with EasyInvoicePDF.com. Free and open-source. No signup required.",
            creator: "@vlad_sazon",
            images: [
              {
                url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
                type: "image/png",
                width: 1200,
                height: 630,
                alt: "EasyInvoicePDF.com - Free Invoice Generator with Live PDF Preview",
              },
            ],
          },
        }),
  };
}

export default async function AppPage() {
  const githubStarsCount = await fetchGithubStars();

  return (
    <CTAToastProvider>
      <AppPageClient githubStarsCount={githubStarsCount} />
    </CTAToastProvider>
  );
}
