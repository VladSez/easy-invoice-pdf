import { DeviceContextProvider } from "@/contexts/device-context";
import { checkDeviceUserAgent } from "@/lib/check-device.server";
import { NextIntlClientProvider } from "next-intl";
// import { ReactScan } from "@/components/dev/react-scan";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { type WebSite, type WithContext } from "schema-dts";
import { Toaster } from "sonner";

import { STATIC_ASSETS_URL } from "@/config";

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
  title: "App | Free Invoice Generator – Live Preview, No Sign-Up",
  description:
    "Create and download professional invoices instantly with EasyInvoicePDF.com. Free and open-source. No signup required.",
  keywords:
    "invoice generator, pdf invoice, invoice maker, invoice template, online invoice, billing software, open-source, free invoice generator",
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

const JSONLD: WithContext<WebSite> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: "https://easyinvoicepdf.com/",
  name: "EasyInvoicePDF.com | Free Invoice Generator – Live Preview, No Sign-Up",
  description:
    "Create and download professional invoices instantly with EasyInvoicePDF.com. Free and open-source. No signup required.",
  keywords: [
    "invoice",
    "invoice generator",
    "invoice generating",
    "invoice app",
    "invoice generator app",
    "free invoice generator",
  ],
  image: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
  mainEntityOfPage: {
    "@type": "SoftwareApplication",
    "@id": `https://easyinvoicepdf.com/`,
    name: "EasyInvoicePDF.com | Free Invoice Generator – Live Preview, No Sign-Up",
    description:
      "Create and download professional invoices instantly with EasyInvoicePDF.com. Free and open-source. No signup required.",
    featureList: [
      "Live preview invoice generation",
      "No sign-up required",
      "Free and open-source",
      "Customizable templates",
      "Instant PDF download",
      "Support for multiple languages and currencies",
      "European VAT support",
      "Secure shareable invoice links",
      "Offline support",
    ],
    operatingSystem: "All",
    applicationCategory: "BusinessApplication",
  },
  author: {
    "@type": "Person",
    name: "Uladzislau Sazonau",
    url: "https://vladsazon.com",
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
                {/* https://vercel.com/vladsazon27s-projects/pdf-invoice-generator/speed-insights */}
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
              id="json-ld"
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }}
            />
          </NextIntlClientProvider>
        </DeviceContextProvider>
      </body>
    </html>
  );
}
