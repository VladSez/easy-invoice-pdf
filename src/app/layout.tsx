import { DeviceContextProvider } from "@/contexts/device-context";
import { checkDeviceUserAgent } from "@/lib/check-device.server";
import { NextIntlClientProvider } from "next-intl";
import { ResponsiveIndicator } from "@/components/dev/responsive-indicator";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { Toaster } from "sonner";

import { PERSONAL_WEBSITE_URL, STATIC_ASSETS_URL } from "@/config";
import { JsonLdScript } from "@/lib/seo/render-json-ld";
import { buildSiteWideJsonLdGraph } from "@/lib/seo/site-entities";

import "./globals.css";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

export const viewport: Viewport = {
  initialScale: 1, // Sets the default zoom level to 1 (100%)
  width: "device-width", // Ensures the viewport width matches the device's screen width
  maximumScale: 1, // Prevents users from zooming in
  viewportFit: "cover", // Enables edge-to-edge content display on devices with rounded corners (like iPhones with a notch)
};

export const metadata: Metadata = {
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {
    isDesktop: isDesktopServer,
    isAndroid,
    isMobile,
    inAppInfo,
  } = await checkDeviceUserAgent();

  const siteWideJsonLd = buildSiteWideJsonLdGraph();

  return (
    <html lang="en">
      <body>
        <DeviceContextProvider
          isDesktop={isDesktopServer}
          isAndroid={isAndroid}
          isMobile={isMobile}
          inAppInfo={inAppInfo}
        >
          <NextIntlClientProvider>
            {children}

            {/* https://sonner.emilkowal.ski/ */}
            <Toaster visibleToasts={1} richColors closeButton />
            {/* show responsive indicator(tailwind breakpoint) for debugging responsive designs */}
            {process.env.NODE_ENV === "development" ? (
              <ResponsiveIndicator />
            ) : null}
            {/* should only be enabled in production */}
            {process.env.VERCEL_ENV === "production" && (
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
            )}
            <JsonLdScript id="site-wide-json-ld" data={siteWideJsonLd} />
          </NextIntlClientProvider>
        </DeviceContextProvider>
      </body>
    </html>
  );
}
