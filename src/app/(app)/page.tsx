import type { Metadata } from "next";
import { AppPageClient } from "./page.client";
import { STATIC_ASSETS_URL } from "@/config";

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
    alternates: {
      canonical: "/",
    },
    ...(isStripeTemplate && {
      openGraph: {
        title: "Stripe Invoice Template | Free Invoice Generator",
        description:
          "Create and download professional invoices instantly with EasyInvoicePDF.com. Free and open-source. No signup required.",
        siteName: "EasyInvoicePDF.com | Free Invoice Generator",
        images: [
          {
            url: `${STATIC_ASSETS_URL}/stripe-og.png?v=1755773921680`,
            width: 1200,
            height: 630,
            alt: "Stripe Invoice Template",
          },
        ],
      },
    }),
  };
}

export default function AppPage() {
  return <AppPageClient />;
}
