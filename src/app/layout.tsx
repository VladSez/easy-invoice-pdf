import { DeviceContextProvider } from "@/contexts/device-context";
import { checkDeviceUserAgent } from "@/lib/check-device.server";
import { NextIntlClientProvider } from "next-intl";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { type WebSite, type WithContext } from "schema-dts";
import { Toaster } from "sonner";

import { APP_URL } from "@/config";

import "./globals.css";

export const viewport: Viewport = {
  initialScale: 1, // Sets the default zoom level to 1 (100%)
  width: "device-width", // Ensures the viewport width matches the device's screen width
  maximumScale: 1, // Prevents users from zooming in
  viewportFit: "cover", // Enables edge-to-edge content display on devices with rounded corners (like iPhones with a notch)
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Invoice Generator with Live Preview | No Sign-Up",
  description:
    "Create and download professional invoices instantly with real-time preview. Free and open-source. No signup required.",
  keywords:
    "invoice generator, pdf invoice, invoice maker, invoice template, online invoice, billing software, open-source, free invoice generator",
  authors: [{ name: "Uladzislau Sazonau" }],
  creator: "Uladzislau Sazonau",
  publisher: "Uladzislau Sazonau",
  icons: {
    icon: [
      {
        url: "https://ik.imagekit.io/fl2lbswwo/favicon.ico",
      },
      {
        url: "https://ik.imagekit.io/fl2lbswwo/icon.png",
        type: "image/png",
        sizes: "96x96",
      },
    ],
    apple: [
      {
        url: "https://ik.imagekit.io/fl2lbswwo/apple-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
  openGraph: {
    title: "Invoice Generator with Live Preview | No Sign-Up",
    description:
      "Create and download professional invoices instantly with real-time preview. Free and open-source. No signup required.",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://easy-invoice-pdf-assets.1xeq.workers.dev/easy-invoice-opengraph-image.png?v=1",
        width: 1200,
        height: 630,
        alt: "Free Invoice Generator - A web application offering live preview, open source functionality, and no sign up required",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Invoice Generator with Live Preview | No Sign-Up",
    description:
      "Create and download professional invoices instantly with real-time preview. Free and open-source. No signup required.",
    creator: "@vlad_sazon",
    images: [
      {
        url: "https://easy-invoice-pdf-assets.1xeq.workers.dev/easy-invoice-opengraph-image.png?v=1",
        width: 1200,
        height: 630,
        alt: "Free Invoice Generator - A web application offering live preview, open source functionality, and no sign up required",
      },
    ],
  },
};

const JSONLD: WithContext<WebSite> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: "https://easyinvoicepdf.com/",
  name: "EasyInvoicePDF.com",
  description: "Invoice Generator with Live Preview | No Sign-Up",
  keywords: [
    "invoice",
    "invoice generator",
    "invoice generating",
    "invoice app",
    "invoice generator app",
    "free invoice generator",
  ],
  image: "https://ik.imagekit.io/fl2lbswwo/opengraph-image.png",
  mainEntityOfPage: {
    "@type": "SoftwareApplication",
    "@id": `https://easyinvoicepdf.com/`,
    name: "EasyInvoicePDF.com",
    description: "Invoice Generator with Live Preview | No Sign-Up",
    featureList: [
      "Live preview invoice generation",
      "No sign-up required",
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
  const { isDesktop: isDesktopServer } = await checkDeviceUserAgent();

  return (
    <html lang="en">
      <body>
        <DeviceContextProvider isDesktop={isDesktopServer}>
          <NextIntlClientProvider>
            {/* React-scan is a tool for detecting and fixing issues with React
            components https://github.com/aidenybai/react-scan#readme Uncomment
            if needed */}
            {/* {process.env.VERCEL_ENV === "development" && (
              <head>
                <script
                  crossOrigin="anonymous"
                  src="//unpkg.com/react-scan/dist/auto.global.js"
                />
              </head>
            )} */}

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
