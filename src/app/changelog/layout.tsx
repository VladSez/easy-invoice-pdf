import { Header } from "@/app/(components)/header";
import { Footer } from "@/app/(components)/footer";
import {
  PERSONAL_WEBSITE_URL,
  STATIC_ASSETS_URL,
  TWITTER_CREATOR,
} from "@/config";
import type { Metadata } from "next";
import { ChangelogIndexJsonLd } from "./changelog-index-json-ld";
import {
  CHANGELOG_INDEX_DESCRIPTION,
  CHANGELOG_INDEX_TITLE,
} from "./build-changelog-json-ld";

// Enable static generation for changelog layout
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: CHANGELOG_INDEX_TITLE,
  description: CHANGELOG_INDEX_DESCRIPTION,
  keywords: [
    "changelog",
    "updates",
    "releases",
    "features",
    "bug fixes",
    "pdf invoice generator",
    "easyinvoicepdf",
    "easy invoice pdf changelog",
  ],
  authors: [{ name: "Vlad Sazonau", url: PERSONAL_WEBSITE_URL }],
  creator: "Vlad Sazonau",
  publisher: "Vlad Sazonau",
  alternates: {
    canonical: "https://easyinvoicepdf.com/changelog",
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
    title: CHANGELOG_INDEX_TITLE,
    description: CHANGELOG_INDEX_DESCRIPTION,
    siteName: "EasyInvoicePDF.com | Free Invoice PDF Generator",
    type: "website",
    locale: "en_US",
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
    title: CHANGELOG_INDEX_TITLE,
    description: CHANGELOG_INDEX_DESCRIPTION,
    creator: TWITTER_CREATOR,
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
};

interface ChangelogLayoutProps {
  children: React.ReactNode;
}

// https://nextjs.org/docs/app/guides/mdx
export default function ChangelogLayout({ children }: ChangelogLayoutProps) {
  return (
    <>
      <ChangelogIndexJsonLd />
      <Header />
      {children}
      <Footer />
    </>
  );
}
