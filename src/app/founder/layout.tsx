import { Footer } from "@/app/(components)/footer";
import { Header } from "@/app/(components)/header";
import {
  PERSONAL_WEBSITE_URL,
  STATIC_ASSETS_URL,
  TWITTER_CREATOR,
} from "@/config";
import {
  FOUNDER_PAGE_DESCRIPTION,
  FOUNDER_PAGE_TITLE,
  FOUNDER_PAGE_URL,
} from "@/lib/seo/site-entities";
import type { Metadata } from "next";
import { FounderJsonLd } from "./founder-json-ld";

export const dynamic = "force-static";

const ogImageAlt = "Vlad Sazonau, founder of EasyInvoicePDF — product engineer";

export const metadata: Metadata = {
  title: FOUNDER_PAGE_TITLE,
  description: FOUNDER_PAGE_DESCRIPTION,
  keywords: [
    "Vlad Sazonau",
    "EasyInvoicePDF",
    "founder",
    "product engineer",
    "invoice PDF generator",
  ],
  authors: [{ name: "Vlad Sazonau", url: PERSONAL_WEBSITE_URL }],
  creator: "Vlad Sazonau",
  publisher: "Vlad Sazonau",
  alternates: {
    canonical: FOUNDER_PAGE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: FOUNDER_PAGE_TITLE,
    description: FOUNDER_PAGE_DESCRIPTION,
    siteName: "EasyInvoicePDF.com | Free Invoice PDF Generator",
    type: "profile",
    locale: "en_US",
    url: FOUNDER_PAGE_URL,
    images: [
      {
        url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: FOUNDER_PAGE_TITLE,
    description: FOUNDER_PAGE_DESCRIPTION,
    creator: TWITTER_CREATOR,
    images: [
      {
        url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: ogImageAlt,
      },
    ],
  },
};

interface FounderLayoutProps {
  children: React.ReactNode;
}

export default function FounderLayout({ children }: FounderLayoutProps) {
  return (
    <>
      <FounderJsonLd />
      <Header />
      {children}
      <Footer />
    </>
  );
}
