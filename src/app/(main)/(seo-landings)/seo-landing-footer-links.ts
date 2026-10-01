import { STRIPE_TEMPLATE_PATHNAME } from "@/utils/invoice-app-url";

import type { SeoLandingSlug } from "./seo-landing-definitions";

/**
 * Footer links to routes of the invoice app itself, listed before the landings.
 *
 * `/stripe-template` is the page meant to rank for "Stripe invoice template"; a link to it
 * from every page, with that phrase as the anchor, is the strongest internal signal we can
 * give it. The `stripe-invoice-alternative` landing below targets "Stripe invoice
 * generator" instead (the "without Stripe" wording it started with had no search volume),
 * so the two do not compete for the same query.
 */
export const APP_FOOTER_SOLUTION_LINKS = [
  {
    href: STRIPE_TEMPLATE_PATHNAME,
    label: "Free Stripe Invoice Template",
  },
] as const satisfies {
  href: string;
  label: string;
}[];

/**
 * Anchor text for the landing links in the site footer.
 *
 * Each label is the landing's own name, so the link text tells a crawler what sits on the
 * other end. Most match the page's `hero.h1`; the Nordic pages lead their h1 with the verb
 * ("Create a Swedish invoice in SEK") and keep the keyword form here instead.
 */
export const SEO_FOOTER_SOLUTION_LINKS = [
  {
    slug: "invoice-generator-no-login",
    label: "Free Invoice Generator - No Sign Up, No Login",
  },
  {
    slug: "open-source-invoice-generator",
    label: "Open-Source Invoice Generator - Free and Self-Hostable",
  },
  {
    slug: "stripe-invoice-alternative",
    label: "Stripe Invoice Generator, No Stripe Account Needed",
  },
  {
    slug: "invoice-template-pdf",
    label: "Free Invoice Template PDF You Fill In Online",
  },
  {
    slug: "multi-language-invoice-generator",
    label: "Invoice Generator in 13 Languages - Free PDF",
  },
  {
    slug: "swedish-invoice-generator",
    label: "Swedish Invoice Generator - Free PDF in SEK",
  },
  {
    slug: "norwegian-invoice-generator",
    label: "Norwegian Invoice Generator - Free PDF in NOK",
  },
  {
    slug: "contractor-invoice-template",
    label: "Free Contractor Invoice Template",
  },
  {
    slug: "freelance-invoice-template",
    label: "Free Freelance Invoice Template",
  },
  {
    slug: "proforma-invoice-generator",
    label: "Free Proforma Invoice Generator",
  },
  {
    slug: "export-invoice-format",
    label: "Export Invoice Format for Services from India",
  },
] as const satisfies {
  slug: SeoLandingSlug;
  label: string;
}[];
