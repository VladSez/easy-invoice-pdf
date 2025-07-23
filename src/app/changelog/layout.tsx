import { ProjectLogo } from "@/components/etc/project-logo";
import { Footer } from "@/components/footer";
import { BlackGoToAppButton } from "@/components/go-to-app-button-cta";
import { ProjectLogoDescription } from "@/components/project-logo-description";
import { Button } from "@/components/ui/button";
import { GITHUB_URL, STATIC_ASSETS_URL } from "@/config";
import type { Metadata } from "next";
import Link from "next/link";

// Enable static generation for changelog layout
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Changelog  | Free Invoice Generator – Live Preview, No Sign-Up",
  description:
    "Stay up to date with the latest features, improvements, and bug fixes in EasyInvoicePDF.",
  keywords: [
    "changelog",
    "updates",
    "releases",
    "features",
    "bug fixes",
    "pdf invoice generator",
  ],
  authors: [{ name: "Uladzislau Sazonau" }],
  creator: "Uladzislau Sazonau",
  publisher: "Uladzislau Sazonau",
  openGraph: {
    title: "Changelog | Free Invoice Generator – Live Preview, No Sign-Up",
    description:
      "Stay up to date with the latest features, improvements, and bug fixes in EasyInvoicePDF.",
    siteName: "EasyInvoicePDF.com | Free Invoice Generator",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=5`,
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
      "Stay up to date with the latest features, improvements, and bug fixes in EasyInvoicePDF.",
    creator: "@vlad_sazon",
    images: [
      {
        url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=5`,
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
      <Header />
      {children}
      <Footer
        translations={{
          footerDescription:
            "A free, open-source tool for creating professional invoices with real-time preview.",
          footerCreatedBy: "Created by",
          product: "Product",

          newsletterTitle: "Subscribe to our newsletter",
          newsletterDescription:
            "Get the latest updates and news from EasyInvoicePDF.com",
          newsletterSubscribe: "Subscribe",
          newsletterPlaceholder: "Enter your email",
          newsletterSuccessMessage: "Thank you for subscribing!",
          newsletterErrorMessage: "Failed to subscribe. Please try again.",
          newsletterEmailLanguageInfo: "All emails will be sent in English",
        }}
        links={
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
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
                href="https://pdfinvoicegenerator.userjot.com/?cursor=1&order=top&limit=10"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                Share feedback
              </Link>
            </li>
          </ul>
        }
      />
    </>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-xs">
      <div className="flex items-center justify-center">
        <div className="container h-auto px-3 py-2 sm:h-16 sm:py-0">
          <div className="flex h-full flex-row flex-wrap items-center justify-between gap-2">
            <div className="w-[53%] sm:w-auto">
              <Logo />
            </div>
            <div className="flex items-center sm:mt-0 sm:gap-2">
              <Button
                _variant="ghost"
                className="hidden lg:inline-flex"
                asChild
              >
                <Link href="/en/about">About product</Link>
              </Button>
              <Button
                _variant="ghost"
                className="hidden lg:inline-flex"
                asChild
              >
                <Link
                  href="https://pdfinvoicegenerator.userjot.com/?cursor=1&order=top&limit=10"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share feedback
                </Link>
              </Button>
              <BlackGoToAppButton className="px-3 sm:px-8">
                Go to App
              </BlackGoToAppButton>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div>
      <div className="flex items-center gap-1 sm:gap-2">
        <ProjectLogo className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
        <ProjectLogoDescription>
          Free Invoice Generator with Live PDF Preview
        </ProjectLogoDescription>
      </div>
    </div>
  );
}
