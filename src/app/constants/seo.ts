import {
  type SoftwareApplication,
  type WebSite,
  type WithContext,
} from "schema-dts";
import { type BreadcrumbList, type SiteNavigationElement } from "schema-dts";
import { STATIC_ASSETS_URL } from "@/config";

export const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: "https://easyinvoicepdf.com/",
  name: "EasyInvoicePDF | Free & Open-Source Invoice Generator – Live Preview, No Sign-Up",
  description:
    "Create and download professional invoices instantly with EasyInvoicePDF. Free and open-source. No signup required.",
  keywords: [
    "invoice pdf generator",
    "free invoice pdf",
    "create invoice pdf",
    "invoice generator open source",
    "pdf invoice template",
    "invoice generator",
    "free invoice generator",
    "online invoice generator",
    "invoice maker pdf",
    "professional invoice generator",
  ],
  image: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
  mainEntityOfPage: {
    "@type": "SoftwareApplication",
    "@id": `https://easyinvoicepdf.com/`,
    name: "EasyInvoicePDF | Free & Open-Source Invoice Generator – Live Preview, No Sign-Up",
    description:
      "Create and download professional invoices instantly with EasyInvoicePDF. Free and open-source. No signup required.",
    featureList: [
      "Live Preview: See changes in real-time as you type",
      "Shareable Links: Send invoices directly to clients without attachments",
      "No Sign-Up Required: Start creating invoices immediately without any registration",
      "Browser Only: No server uploads, your data stays private",
      "Multi-Language: Support for 10+ languages and all major currencies",
      "Flexible Tax Support: VAT, GST, Sales Tax, and custom tax formats with automatic calculations",
      "Multiple Templates: Including modern Stripe-style design",
      "Instant PDF: One-click download ready for printing or sending",
      "Mobile-Friendly: Fully responsive design works perfectly on all devices",
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
      name: "Invoice Generator",
      item: "https://easyinvoicepdf.com/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "About",
      item: "https://easyinvoicepdf.com/en/about",
    },
    {
      "@type": "ListItem",
      position: 3,
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

export const SOFTWARE_APPLICATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "EasyInvoicePDF | Free & Open-Source Invoice Generator – Live Preview, No Sign-Up",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
} as const satisfies WithContext<SoftwareApplication>;
