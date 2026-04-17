import { Header } from "@/app/(components)/header";
import { GITHUB_URL, LINKEDIN_URL, STATIC_ASSETS_URL, TWITTER_URL } from "@/config";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vlad Sazonau | Founder of EasyInvoicePDF",
  description:
    "Meet Vlad Sazonau, the founder of EasyInvoicePDF.com. Product engineer and design enthusiast with 8+ years of experience building beautiful, functional products.",
  keywords: [
    "Vlad Sazonau",
    "EasyInvoicePDF founder",
    "product engineer",
    "indie developer",
    "easyinvoicepdf",
  ],
  authors: [{ name: "Uladzislau Sazonau" }],
  creator: "Uladzislau Sazonau",
  publisher: "Uladzislau Sazonau",
  alternates: {
    canonical: "https://easyinvoicepdf.com/founder",
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
    title: "Vlad Sazonau | Founder of EasyInvoicePDF",
    description:
      "Meet Vlad Sazonau, the founder of EasyInvoicePDF.com. Product engineer and design enthusiast with 8+ years of experience building beautiful, functional products.",
    siteName: "EasyInvoicePDF.com | Free Invoice Generator",
    type: "profile",
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
    title: "Vlad Sazonau | Founder of EasyInvoicePDF",
    description:
      "Meet Vlad Sazonau, the founder of EasyInvoicePDF.com. Product engineer and design enthusiast.",
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

export default function ContactPage() {
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
      <div className="bg-gradient-to-b from-slate-50 to-white py-12 md:py-24 lg:min-h-screen">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="mb-8 overflow-hidden rounded-full border-4 border-slate-200 shadow-lg">
              <img
                src="https://ik.imagekit.io/fl2lbswwo/avatar.jpeg?updatedAt=1757456439459"
                alt="Vlad Sazonau"
                width={160}
                height={160}
                loading="lazy"
                decoding="async"
                className="size-40 object-cover"
              />
            </div>

            {/* Name and Title */}
            <h1 className="text-center text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Vlad Sazonau
            </h1>
            <p className="mt-3 text-center text-xl text-slate-600 md:text-2xl">
              Product Engineer & Design Enthusiast
            </p>

            {/* Bio */}
            <p className="mx-auto mt-8 max-w-xl text-center text-lg leading-relaxed text-slate-700">
              I&apos;m a product-minded generalist with 8+ years of experience
              building beautiful, functional products. I enjoy solving complex
              problems at the intersection of engineering and design.
            </p>

            {/* Social Links */}
            <div className="mt-12 flex flex-wrap justify-center gap-4 md:gap-6">
              <Link
                href="https://vladsazon.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-900 underline transition-all hover:opacity-80"
                aria-label="Visit website"
              >
                Website
              </Link>

              <Link
                href={TWITTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-900 underline transition-all hover:opacity-80"
                aria-label="Visit Twitter"
              >
                Twitter
              </Link>

              <Link
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-900 underline transition-all hover:opacity-80"
                aria-label="Visit LinkedIn"
              >
                LinkedIn
              </Link>

              <Link
                href={"https://github.com/VladSez"}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-900 underline transition-all hover:opacity-80"
                aria-label="Visit GitHub"
              >
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
