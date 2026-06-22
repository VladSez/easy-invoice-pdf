import { Footer } from "@/app/(components)/footer";
import { Header } from "@/app/(components)/header";
import {
  PERSONAL_WEBSITE_URL,
  STATIC_ASSETS_URL,
  TWITTER_CREATOR,
} from "@/config";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Service | EasyInvoicePDF",
  description:
    "Terms of Service for EasyInvoicePDF.com. Browser-based invoice PDF tool.",
  keywords: [
    "terms of service",
    "easyinvoicepdf",
    "invoice generator",
    "legal",
  ],
  authors: [{ name: "Vlad Sazonau", url: PERSONAL_WEBSITE_URL }],
  creator: "Vlad Sazonau",
  publisher: "Vlad Sazonau",
  alternates: {
    canonical: "https://easyinvoicepdf.com/tos",
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
    title: "Terms of Service | EasyInvoicePDF",
    description:
      "Terms of Service for EasyInvoicePDF.com. Browser-based invoice PDF tool.",
    siteName: "EasyInvoicePDF.com | Free Invoice PDF Generator",
    type: "website",
    locale: "en_US",
    url: "https://easyinvoicepdf.com/tos",
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
    title: "Terms of Service | EasyInvoicePDF",
    description:
      "Terms of Service for EasyInvoicePDF.com. Browser-based invoice PDF tool.",
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

interface TosLayoutProps {
  children: React.ReactNode;
}

export default function TosLayout({ children }: TosLayoutProps) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
