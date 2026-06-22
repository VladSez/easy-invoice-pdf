import { Footer } from "@/app/(components)/footer";
import { Header } from "@/app/(components)/header";
import {
  PERSONAL_WEBSITE_URL,
  STATIC_ASSETS_URL,
  TWITTER_CREATOR,
} from "@/config";
import type { Metadata } from "next";
import { HowItWorksJsonLd } from "./how-it-works-json-ld";

export const dynamic = "force-static";

const HOW_IT_WORKS_PAGE_URL = "https://easyinvoicepdf.com/how-it-works";

const PAGE_TITLE = "How EasyInvoicePDF Works | Video Tutorials";

const PAGE_DESCRIPTION =
  "Watch step-by-step video tutorials on creating invoices, saving seller and buyer details, and generating weekly invoices with EasyInvoicePDF.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "how easyinvoicepdf works",
    "invoice generator tutorial",
    "create invoice video",
    "add seller invoice",
    "add buyer invoice",
    "weekly invoices",
    "easyinvoicepdf demo",
    "pdf invoice generator guide",
  ],
  authors: [{ name: "Vlad Sazonau", url: PERSONAL_WEBSITE_URL }],
  creator: "Vlad Sazonau",
  publisher: "Vlad Sazonau",
  alternates: {
    canonical: HOW_IT_WORKS_PAGE_URL,
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
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    siteName: "EasyInvoicePDF.com | Free Invoice PDF Generator",
    type: "website",
    locale: "en_US",
    url: HOW_IT_WORKS_PAGE_URL,
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
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
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

interface HowItWorksLayoutProps {
  children: React.ReactNode;
}

export default function HowItWorksLayout({ children }: HowItWorksLayoutProps) {
  return (
    <>
      <HowItWorksJsonLd />
      <Header />
      {children}
      <Footer />
    </>
  );
}
