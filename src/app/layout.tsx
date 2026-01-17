import { DeviceContextProvider } from "@/contexts/device-context";
import { checkDeviceUserAgent } from "@/lib/check-device.server";
import { NextIntlClientProvider } from "next-intl";
// import { ReactScan } from "@/components/dev/react-scan";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { Toaster } from "sonner";

import { STATIC_ASSETS_URL } from "@/config";
import {
  BREADCRUMB_JSONLD,
  SITE_NAVIGATION_JSONLD,
  SOFTWARE_APPLICATION_JSONLD,
  WEBSITE_JSONLD,
} from "./constants/seo";

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
  authors: [{ name: "Uladzislau Sazonau" }],
  creator: "Uladzislau Sazonau",
  publisher: "Uladzislau Sazonau",
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

  return (
    <html lang="en">
      {/* Performance monitoring only in development */}
      {/* {process.env.NODE_ENV !== "development" ? null : <ReactScan />} */}
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
            {/* should only be enabled in production */}
            {process.env.VERCEL_ENV === "production" && (
              <>
                <SpeedInsights />
                {/* https://eu.umami.is/dashboard */}
                <Script
                  // we proxy umami check next.config.mjs rewrites
                  src="/stats/script.js"
                  data-website-id="1914352c-5ebb-4806-bfc3-f494712bb4a4"
                  defer
                />
              </>
            )}
            <script
              id="website-json-ld"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(WEBSITE_JSONLD),
              }}
            />
            <script
              id="breadcrumb-json-ld"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(BREADCRUMB_JSONLD),
              }}
            />
            <script
              id="site-navigation-json-ld"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(SITE_NAVIGATION_JSONLD),
              }}
            />
            <script
              id="software-application-json-ld"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(SOFTWARE_APPLICATION_JSONLD),
              }}
            />
          </NextIntlClientProvider>
        </DeviceContextProvider>
      </body>
    </html>
  );
}
