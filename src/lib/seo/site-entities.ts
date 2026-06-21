/**
 * Site-wide JSON-LD entities (WebSite, Person, WebApplication).
 *
 * Content-accuracy rules:
 * - Never add JSON-LD for content not rendered on the page.
 * - Skip page-level JSON-LD on noindex routes (share links, non-indexable homepage).
 * - author.name = person name only (no role suffix per Google Article guide).
 */

import {
  GITHUB_URL,
  LINKEDIN_URL,
  PERSONAL_WEBSITE_URL,
  PROD_WEBSITE_URL,
  STATIC_ASSETS_URL,
  TWITTER_URL,
} from "@/config";

import { JSON_LD_BASE, JSON_LD_IDS } from "./json-ld-ids";

export const SITE_NAME =
  "EasyInvoicePDF | Free & Open-Source Invoice Generator – Live Preview, No Sign-Up";

const SITE_DESCRIPTION =
  "Create and download professional invoices instantly with EasyInvoicePDF. Free and open-source. No signup required.";

export const HOME_PAGE_DESCRIPTION =
  "Create invoices online for free with our PDF invoice generator. Customize templates, download instantly, no signup required.";

const FOUNDER_AVATAR_URL =
  "https://ik.imagekit.io/fl2lbswwo/avatar.jpeg?updatedAt=1757456439459";

export const FOUNDER_PAGE_URL = `${PROD_WEBSITE_URL}/founder`;

export const OG_IMAGE_URL = `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`;

const WEB_APPLICATION_FEATURES = [
  "Live preview as you type",
  "No sign-up needed",
  "No ads",
  "Save seller and buyer details for future reuse",
  "Flexible tax: VAT, GST, custom options",
  "Fully customizable invoice templates",
  "Supports 10+ languages, all major currencies",
  "One-click instant PDF download",
  "Browser only, data stays private",
  "Share via link, no attachments",
  "Mobile friendly",
] as const;

export function buildSlimWebSite() {
  return {
    "@type": "WebSite" as const,
    "@id": JSON_LD_IDS.website,
    url: `${JSON_LD_BASE}/`,
    name: SITE_NAME,
  };
}

export function buildFullWebSite() {
  return {
    "@type": "WebSite" as const,
    "@id": JSON_LD_IDS.website,
    url: `${JSON_LD_BASE}/`,
    name: SITE_NAME,
    alternateName: ["EasyInvoicePDF", "easyinvoicepdf.com"],
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: {
      "@id": JSON_LD_IDS.person,
    },
    image: {
      "@type": "ImageObject" as const,
      "@id": JSON_LD_IDS.websiteImage,
      url: OG_IMAGE_URL,
      caption: "EasyInvoicePDF",
    },
  };
}

export function buildPerson() {
  return {
    "@type": "Person" as const,
    "@id": JSON_LD_IDS.person,
    url: FOUNDER_PAGE_URL,
    name: "Uladzislau Sazonau",
    givenName: "Uladzislau",
    familyName: "Sazonau",
    description:
      "Founder of EasyInvoicePDF, the free open-source invoice PDF generator with live preview.",
    image: {
      "@type": "ImageObject" as const,
      "@id": JSON_LD_IDS.personImage,
      url: FOUNDER_AVATAR_URL,
      caption: "Uladzislau Sazonau",
    },
    sameAs: [PERSONAL_WEBSITE_URL, GITHUB_URL, LINKEDIN_URL, TWITTER_URL],
  };
}

export function buildWebApplication() {
  return {
    "@type": "WebApplication" as const,
    "@id": JSON_LD_IDS.app,
    url: `${JSON_LD_BASE}/`,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    featureList: [...WEB_APPLICATION_FEATURES],
    creator: {
      "@id": JSON_LD_IDS.person,
    },
    sameAs: [GITHUB_URL],
    offers: {
      "@type": "Offer" as const,
      price: "0",
      priceCurrency: "EUR",
    },
  };
}

export function buildSiteWideJsonLdGraph() {
  return {
    "@context": "https://schema.org" as const,
    "@graph": [buildSlimWebSite(), buildPerson()],
  };
}
