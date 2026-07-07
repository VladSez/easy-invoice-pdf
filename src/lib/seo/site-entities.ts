/**
 * Site-wide JSON-LD entities (WebSite, Organization, Person, WebApplication).
 *
 * Content-accuracy rules:
 * - Never add JSON-LD for content not rendered on the page.
 * - Skip page-level JSON-LD on noindex routes (share links, non-indexable homepage).
 * - author.name = person name only (no role suffix per Google Article guide).
 */

import {
  FOUNDER_AVATAR_URL,
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
  "Create professional PDF invoices online for free. Customize invoice templates, add your logo, download instantly, and send invoices without signup.";

export const FOUNDER_PAGE_URL = `${PROD_WEBSITE_URL}/founder`;

export const FOUNDER_PAGE_TITLE = "Vlad Sazonau | Founder of EasyInvoicePDF";

export const FOUNDER_PAGE_DESCRIPTION =
  "Meet Vlad Sazonau, founder of EasyInvoicePDF, the free open-source invoice PDF generator with live preview. Product engineer and design enthusiast with 8+ years building digital products.";

export const OG_IMAGE_URL = `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`;

const START_INVOICING_URL = `${JSON_LD_BASE}/?template=default`;

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
      "@id": JSON_LD_IDS.organization,
    },
    image: {
      "@type": "ImageObject" as const,
      "@id": JSON_LD_IDS.websiteImage,
      url: OG_IMAGE_URL,
      caption: "EasyInvoicePDF",
    },
  };
}

export function buildOrganization() {
  return {
    "@type": "Organization" as const,
    "@id": JSON_LD_IDS.organization,
    name: "EasyInvoicePDF",
    url: `${JSON_LD_BASE}/`,
    sameAs: [GITHUB_URL],
  };
}

export function buildPerson() {
  return {
    "@type": "Person" as const,
    "@id": JSON_LD_IDS.person,
    url: FOUNDER_PAGE_URL,
    name: "Vlad Sazonau",
    givenName: "Uladzislau",
    familyName: "Sazonau",
    description:
      "Founder of EasyInvoicePDF, the free open-source invoice PDF generator with live preview.",
    image: {
      "@type": "ImageObject" as const,
      "@id": JSON_LD_IDS.personImage,
      url: FOUNDER_AVATAR_URL,
      caption: "Vlad Sazonau",
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
      "@id": JSON_LD_IDS.organization,
    },
    sameAs: [GITHUB_URL],
    offers: {
      "@type": "Offer" as const,
      price: "0",
      priceCurrency: "EUR",
    },
    potentialAction: {
      "@type": "UseAction" as const,
      name: "Start Invoicing",
      target: START_INVOICING_URL,
    },
  };
}

export function buildSiteNavigationList() {
  return {
    "@type": "ItemList" as const,
    "@id": JSON_LD_IDS.siteNavigation,
    name: "Site navigation",
    itemListElement: [
      {
        "@type": "ListItem" as const,
        position: 1,
        name: "Start Invoicing",
        item: START_INVOICING_URL,
      },
      {
        "@type": "ListItem" as const,
        position: 2,
        name: "About",
        item: `${JSON_LD_BASE}/en/about`,
      },
      {
        "@type": "ListItem" as const,
        position: 3,
        name: "Changelog",
        item: `${JSON_LD_BASE}/changelog`,
      },
      {
        "@type": "ListItem" as const,
        position: 4,
        name: "Terms of Service",
        item: `${JSON_LD_BASE}/tos`,
      },
    ],
  };
}

export function buildSiteWideJsonLdGraph() {
  return {
    "@context": "https://schema.org" as const,
    "@graph": [buildSlimWebSite()],
  };
}
