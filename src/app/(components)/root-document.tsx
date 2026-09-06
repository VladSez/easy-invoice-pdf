import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, type Locale } from "next-intl";
import Script from "next/script";
import { Toaster } from "sonner";

import { ResponsiveIndicator } from "@/components/dev/responsive-indicator";
import { SentryIndicator } from "@/components/dev/sentry-indicator";
import { PERSONAL_WEBSITE_URL, STATIC_ASSETS_URL } from "@/config";
import { JsonLdScript } from "@/lib/seo/render-json-ld";
import { buildSiteWideJsonLdGraph } from "@/lib/seo/site-entities";

import "@/app/globals.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

interface RootDocumentProps {
  /** Value of the `<html lang>` attribute: the locale the document is rendered in. */
  lang: Locale;
  children: React.ReactNode;
}

/**
 * The `<html>`/`<body>` shell shared by both root layouts.
 *
 * The app has two root layouts: `src/app/(main)/layout.tsx` for the unprefixed
 * English routes (`/`, `/changelog`, ...) and `src/app/[locale]/layout.tsx` for the
 * localized ones. `[locale]` has to be a root layout so that `locale` is a *root
 * param* (`next/root-params`), which is how next-intl resolves the locale without
 * `setRequestLocale()`. Everything that used to live in the single root layout
 * is here so the two shells cannot drift apart.
 *
 * Deliberately free of dynamic APIs (`headers()`, `cookies()`, `searchParams`): it
 * sits above *every* route, so anything request-bound here opts the whole app out of
 * static rendering. Server-side device detection is the reason this used to matter —
 * it now lives in `src/app/(main)/(app)/layout.tsx`, next to the only routes that
 * read it.
 */
export function RootDocument({ lang, children }: RootDocumentProps) {
  const siteWideJsonLd = buildSiteWideJsonLdGraph();

  // `data-scroll-behavior` keeps the Next.js 15 behaviour: `scroll-behavior: smooth`
  // (globals.css) is suspended during route transitions so navigations jump to the
  // top instantly. Next.js 16 only does this when the attribute is present.
  return (
    <html lang={lang} data-scroll-behavior="smooth">
      <body>
        <NextIntlClientProvider>
          {children}

          {/* https://sonner.emilkowal.ski/ */}
          <Toaster visibleToasts={1} richColors closeButton />
          {/* show responsive indicator(tailwind breakpoint) for debugging responsive designs */}
          {process.env.NODE_ENV === "development" ? (
            <>
              <ResponsiveIndicator />
              {/* only renders while the browser Sentry SDK is actually live */}
              <SentryIndicator />
            </>
          ) : null}
          {/* should only be enabled in production */}
          {process.env.VERCEL_ENV === "production" ? (
            <>
              <SpeedInsights
                sampleRate={0.3} // send only x% of the requests to Speed Insights (for cost-saving)
              />
              {/* https://eu.umami.is/dashboard */}
              <Script
                // we proxy umami check next.config.mjs rewrites
                src="/stats/script.js"
                data-website-id="1914352c-5ebb-4806-bfc3-f494712bb4a4"
                defer
              />
            </>
          ) : null}
          <JsonLdScript id="site-wide-json-ld" data={siteWideJsonLd} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

/** Base `viewport` export, re-exported by every root layout. */
export const rootViewport: Viewport = {
  initialScale: 1, // Sets the default zoom level to 1 (100%)
  width: "device-width", // Ensures the viewport width matches the device's screen width
  maximumScale: 1, // Prevents users from zooming in
  viewportFit: "cover", // Enables edge-to-edge content display on devices with rounded corners (like iPhones with a notch)
};

/** Base `metadata` export, re-exported by every root layout; nested routes merge into it. */
export const rootMetadata: Metadata = {
  // metadataBase: new URL(APP_URL),
  title: "Create Invoice — EasyInvoicePDF",
  description:
    "Create and download professional invoices instantly with EasyInvoicePDF.com. Free and open-source. No signup required.",
  keywords: [
    "invoice pdf generator",
    "free invoice pdf",
    "create invoice pdf",
    "invoice generator open source",
    "pdf invoice template",
    "invoice generator",
    "free invoice generator",
    "online invoice generator",
    "invoice maker pdf",
    "professional invoice generator",
  ],
  authors: [{ name: "Vlad Sazonau", url: PERSONAL_WEBSITE_URL }],
  creator: "Vlad Sazonau",
  publisher: "Vlad Sazonau",
  icons: {
    icon: [
      {
        url: `${STATIC_ASSETS_URL}/favicon.ico`,
      },
      {
        url: `${STATIC_ASSETS_URL}/icon.png`,
        type: "image/png",
        sizes: "96x96",
      },
    ],
    apple: [
      {
        url: `${STATIC_ASSETS_URL}/apple-icon.png`,
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
};
