import { type WebSite, type WithContext } from "schema-dts";
import { type BreadcrumbList, type SiteNavigationElement } from "schema-dts";
import { STATIC_ASSETS_URL } from "@/config";

export const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: "https://easyinvoicepdf.com/",
  name: "EasyInvoicePDF.com | Free Invoice Generator – Live Preview, No Sign-Up",
  description:
    "Create and download professional invoices instantly with EasyInvoicePDF.com. Free and open-source. No signup required.",
  keywords: [
    "invoice",
    "invoice generator",
    "invoice generating",
    "invoice app",
    "invoice generator app",
    "free invoice generator",
  ],
  image: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
  mainEntityOfPage: {
    "@type": "SoftwareApplication",
    "@id": `https://easyinvoicepdf.com/`,
    name: "EasyInvoicePDF.com | Free Invoice Generator – Live Preview, No Sign-Up",
    description:
      "Create and download professional invoices instantly with EasyInvoicePDF.com. Free and open-source. No signup required.",
    featureList: [
      "Live preview invoice generation",
      "No sign-up required",
      "Free and open-source",
      "Customizable templates",
      "Instant PDF download",
      "Stripe-style invoice templates",
      "Support for multiple languages and currencies",
      "European VAT support",
      "Secure shareable invoice links",
    ],
    operatingSystem: "All",
    applicationCategory: "BusinessApplication",
  },
  author: {
    "@type": "Person",
    name: "Uladzislau Sazonau",
    url: "https://vladsazon.com",
  },
} as const satisfies WithContext<WebSite>;

export const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://easyinvoicepdf.com/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Invoice Generator",
      item: "https://easyinvoicepdf.com/",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "About",
      item: "https://easyinvoicepdf.com/en/about",
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Changelog",
      item: "https://easyinvoicepdf.com/changelog",
    },
  ],
} as const satisfies WithContext<BreadcrumbList>;

export const SITE_NAVIGATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SiteNavigationElement",
  name: "Main Navigation",
  url: "https://easyinvoicepdf.com/",
  hasPart: [
    {
      "@type": "SiteNavigationElement",
      name: "Invoice Generator",
      description: "Create professional invoices instantly with live preview",
      url: "https://easyinvoicepdf.com/",
    },
    {
      "@type": "SiteNavigationElement",
      name: "About",
      description:
        "Learn about our free invoice generator features and benefits",
      url: "https://easyinvoicepdf.com/en/about",
    },
    {
      "@type": "SiteNavigationElement",
      name: "Features",
      description:
        "Discover all the powerful features of our invoice generator",
      url: "https://easyinvoicepdf.com/en/about#features",
    },
    {
      "@type": "SiteNavigationElement",
      name: "FAQ",
      description: "Frequently asked questions about the invoice generator",
      url: "https://easyinvoicepdf.com/en/about#faq",
    },
    {
      "@type": "SiteNavigationElement",
      name: "Changelog",
      description: "Latest updates and improvements to the application",
      url: "https://easyinvoicepdf.com/changelog",
    },
  ],
} as const satisfies WithContext<SiteNavigationElement>;
