import type { Metadata } from "next";

import { Footer } from "@/app/(components)/footer";
import { Header } from "@/app/(components)/header";
import {
  PERSONAL_WEBSITE_URL,
  STATIC_ASSETS_URL,
  TWITTER_CREATOR,
} from "@/config";

export const dynamic = "force-static";

const title = "Privacy Policy | EasyInvoicePDF";
const description =
  "How EasyInvoicePDF handles invoice data, account details, and connected email permissions.";

export const metadata: Metadata = {
  title,
  description,
  authors: [{ name: "Vlad Sazonau", url: PERSONAL_WEBSITE_URL }],
  creator: "Vlad Sazonau",
  publisher: "Vlad Sazonau",
  alternates: { canonical: "https://easyinvoicepdf.com/privacy" },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    siteName: "EasyInvoicePDF.com | Free Invoice PDF Generator",
    type: "website",
    locale: "en_US",
    url: "https://easyinvoicepdf.com/privacy",
    images: [
      {
        url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "EasyInvoicePDF.com - Free Invoice PDF Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: TWITTER_CREATOR,
  },
};

/** Supplies canonical metadata and the shared shell for the privacy policy. */
export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
