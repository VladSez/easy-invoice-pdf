import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { OpenPanelComponent } from "@openpanel/nextjs";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";
import { Toaster } from "sonner";
import { checkDeviceUserAgent } from "@/lib/check-device.server";
import { DeviceContextProvider } from "@/contexts/device-context";

export const viewport: Viewport = {
  initialScale: 1, // Sets the default zoom level to 1 (100%)
  width: "device-width", // Ensures the viewport width matches the device's screen width
  maximumScale: 1, // Prevents users from zooming in
  viewportFit: "cover", // Enables edge-to-edge content display on devices with rounded corners (like iPhones with a notch)
};

export const metadata: Metadata = {
  title: "Invoice PDF Generator with Live Preview | No Sign-Up",
  description:
    "Create and download professional PDF invoices instantly with real-time preview. Free and open-source. No signup required.",
  keywords:
    "invoice generator, pdf invoice generator, free invoice maker, business invoice template, professional invoice, digital invoice, online invoice generator, invoice software, small business invoice, freelancer invoice, tax invoice, electronic invoice, invoice creation tool, billing software, accounting tools,",
  authors: [{ name: "Uladzislau Sazonau" }],
  creator: "Uladzislau Sazonau",
  publisher: "Uladzislau Sazonau",
  metadataBase: new URL("https://easyinvoicepdf.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Invoice PDF Generator with Live Preview | No Sign-Up",
    description:
      "Create and download professional PDF invoices instantly with real-time preview. Free and open-source. No signup required.",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Invoice PDF Generator with Live Preview | No Sign-Up",
    description:
      "Create and download professional PDF invoices instantly with real-time preview. Free and open-source. No signup required.",
    creator: "@vlad_sazon",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
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
      {/* React-scan is a tool for detecting and fixing issues with React components
        https://github.com/aidenybai/react-scan#readme
        Uncomment if needed
      */}
      {/* {process.env.VERCEL_ENV === "development" && (
        <head>
          <script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        </head>
      )} */}
      <body className={`antialiased`}>
        <DeviceContextProvider isDesktop={isDesktopServer}>
          <NuqsAdapter>{children}</NuqsAdapter>
        </DeviceContextProvider>

        {/* https://sonner.emilkowal.ski/ */}
        <Toaster visibleToasts={1} richColors />

        {/* should only be enabled in production */}
        {process.env.VERCEL_ENV === "production" && (
          <>
            {/* https://vercel.com/vladsazon27s-projects/pdf-invoice-generator/speed-insights */}
            <SpeedInsights />
            {/* https://openpanel.dev/docs */}
            <OpenPanelComponent
              clientId="34cab0b1-c372-4d2d-9646-9a4cea67faf9"
              trackScreenViews={true}
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
      </body>
    </html>
  );
}
