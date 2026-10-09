/**
 * Site-wide JSON-LD entities (WebSite, Organization, Person, WebApplication).
 *
 * Content-accuracy rules:
 * - Never add JSON-LD for content not rendered on the page.
 * - Skip page-level JSON-LD on noindex routes (share links, non-indexable homepage).
 * - author.name = person name only (no role suffix per Google Article guide).
 */

import { APP_PAGE_TITLE } from "@/app/(main)/(app)/app-page-heading";
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_INVOICE_PDF_LANGUAGES,
} from "@/app/schema";
import {
  FOUNDER_AVATAR_URL,
  GITHUB_URL,
  LINKEDIN_URL,
  PERSONAL_WEBSITE_URL,
  PRODUCT_TWITTER_URL,
  PROD_WEBSITE_URL,
  STATIC_ASSETS_URL,
  TWITTER_URL,
} from "@/config";

import { JSON_LD_BASE, JSON_LD_IDS } from "./json-ld-ids";

/**
 * The site's name, as Google should print it above a result.
 *
 * Google reads site names from `WebSite.name` and expects the name itself, not a title:
 * a tagline after the brand makes it fall back to a guess from the page title. Other
 * spellings people use go in `alternateName`.
 */
const SITE_NAME = "EasyInvoicePDF";

const SITE_ALTERNATE_NAMES = ["EasyInvoicePDF.com", "Easy Invoice PDF"];

const SITE_DESCRIPTION =
  "Create and download professional invoices instantly with EasyInvoicePDF. Free and open-source. No signup required.";

/** The `<title>` of `/`, also the name of its `WebPage` node. */
export const HOME_PAGE_TITLE = APP_PAGE_TITLE.default;

export const HOME_PAGE_DESCRIPTION =
  "Create professional PDF invoices online for free. Customize invoice templates, add your logo, download instantly, and send invoices without signup.";

export const FOUNDER_PAGE_URL = `${PROD_WEBSITE_URL}/founder`;

export const FOUNDER_PAGE_TITLE = "Vlad Sazonau | Founder of EasyInvoicePDF";

export const FOUNDER_PAGE_DESCRIPTION =
  "Meet Vlad Sazonau, founder of EasyInvoicePDF, the free open-source invoice PDF generator with live preview. Product engineer and design enthusiast.";

export const OG_IMAGE_URL = `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`;

/** Square, 180×180: Google wants an Organization logo of at least 112×112. */
const ORGANIZATION_LOGO_URL = `${STATIC_ASSETS_URL}/apple-icon.png`;

const START_INVOICING_URL = `${JSON_LD_BASE}/`;

const WEB_APPLICATION_FEATURES = [
  "Live preview as you type",
  "No sign-up needed",
  "No ads",
  "Save seller and buyer details for future reuse",
  "Flexible tax: VAT, GST, Sales Tax or a custom label",
  "Two invoice templates: a classic layout and a Stripe-style one",
  // derived from the schema, so the counts can't go stale when a language is added
  `Invoices in ${SUPPORTED_INVOICE_PDF_LANGUAGES.length} languages and ${SUPPORTED_CURRENCIES.length} currencies`,
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
    alternateName: [...SITE_ALTERNATE_NAMES],
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
    name: SITE_NAME,
    url: `${JSON_LD_BASE}/`,
    logo: {
      "@type": "ImageObject" as const,
      url: ORGANIZATION_LOGO_URL,
      width: "180",
      height: "180",
    },
    sameAs: [GITHUB_URL, PRODUCT_TWITTER_URL],
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

export function buildSiteWideJsonLdGraph() {
  return {
    "@context": "https://schema.org" as const,
    "@graph": [buildSlimWebSite()],
  };
}
