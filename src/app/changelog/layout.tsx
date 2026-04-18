import { Header } from "@/app/(components)/header";
import { Footer } from "@/components/footer";
import { GITHUB_URL, STATIC_ASSETS_URL } from "@/config";
import type { Metadata } from "next";
import Link from "next/link";

// Enable static generation for changelog layout
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Changelog  | EasyInvoicePDF - Free & Open-Source Invoice Generator",
  description:
    "Explore the latest updates, new features, and improvements to EasyInvoicePDF.com - the free, open-source invoice generator. Track our development progress and upcoming features.",
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
  authors: [{ name: "Uladzislau Sazonau" }],
  creator: "Uladzislau Sazonau",
  publisher: "Uladzislau Sazonau",
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
    title: "Changelog | EasyInvoicePDF - Free & Open-Source Invoice Generator",
    description:
      "Stay up to date with the latest features, improvements, and bug fixes in EasyInvoicePDF.",
    siteName: "EasyInvoicePDF.com | Free Invoice Generator",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "EasyInvoicePDF.com - Free Invoice Generator with Live PDF Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog | Free Invoice Generator – Live Preview, No Sign-Up",
    description:
      "Stay up to date with the latest features, improvements, and bug fixes in EasyInvoicePDF.com",
    creator: "@vlad_sazon",
    images: [
      {
        url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "EasyInvoicePDF.com - Free Invoice Generator with Live PDF Preview",
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
      <Header
        locale={"en"}
        translations={{
          navLinks: {
            features: "Features",
            faq: "FAQ",
            github: "GitHub",
            githubUrl: GITHUB_URL,
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
          product: "Product",
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
