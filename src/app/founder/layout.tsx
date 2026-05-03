import { Footer } from "@/app/(components)/footer";
import { Header } from "@/app/(components)/header";
import {
  GITHUB_URL,
  PERSONAL_WEBSITE_URL,
  STATIC_ASSETS_URL,
  TWITTER_CREATOR,
} from "@/config";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

const FOUNDER_PAGE_URL = `https://easyinvoicepdf.com/founder`;

const FOUNDER_PAGE_TITLE = "Vlad Sazonau | Founder of EasyInvoicePDF";

const FOUNDER_PAGE_DESCRIPTION =
  "Meet Vlad Sazonau, founder of EasyInvoicePDF, the free open-source invoice PDF generator with live preview. Product engineer and design enthusiast with 8+ years building digital products.";

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
  authors: [{ name: "Uladzislau Sazonau", url: PERSONAL_WEBSITE_URL }],
  creator: "Uladzislau Sazonau",
  publisher: "Uladzislau Sazonau",
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
      <Header
        locale={"en"}
        translations={{
          navLinks: {
            home: "Product",
            features: "Features",
            faq: "FAQ",
            github: "GitHub",
            githubUrl: GITHUB_URL,
            githubCTA: "Star on GitHub",
            tagline: "Free & Open-Source Invoice Generator",
          },
          switchLanguageText: "Switch Language",
          goToAppText: "Open app",
          startInvoicingButtonText: "Start Invoicing",
          changelogLinkText: "Changelog",
          termsOfServiceLinkText: "Terms of Service",
        }}
        hideLanguageSwitcher={true}
      />
      {children}
      <Footer
        translations={{
          footerDescription: (
            <>
              Create professional invoices in seconds with our free &
              open-source invoice maker. 100% in-browser, no sign-up required.
              Includes live PDF preview and a Stripe-style template - perfect
              for freelancers, startups, and small businesses.
              <br /> <br />
              Not accounting software. No compliance guarantees. By using this
              tool, you agree to the{" "}
              <Link
                href="/tos"
                className="text-slate-700 underline hover:text-slate-900"
              >
                Terms of Service
              </Link>
              .
            </>
          ),
          footerCreatedBy: "Made by",
          resources: "Resources",
        }}
        links={
          <ul className="space-y-2">
            <li>
              <Link
                href="/?template=default"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                App
              </Link>
            </li>
            <li>
              <Link
                href="/en/about"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                About
              </Link>
            </li>

            <li>
              <Link
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                GitHub
              </Link>
            </li>

            <li>
              <Link
                href="/tos"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="https://pdfinvoicegenerator.userjot.com/?cursor=1&order=top&limit=10"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                Share feedback
              </Link>
            </li>
            <li>
              <Link
                href="/founder"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                Founder
              </Link>
            </li>
          </ul>
        }
      />
    </>
  );
}
