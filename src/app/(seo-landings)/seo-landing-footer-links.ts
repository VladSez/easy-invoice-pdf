import type { SeoLandingSlug } from "./seo-landing-definitions";

/** Keep each label in sync with the matching landing's hero.h1 in seo-landing-definitions.ts */
export const SEO_FOOTER_SOLUTION_LINKS = [
  {
    slug: "invoice-generator-no-login",
    label: "Free Invoice Generator - No Login Required",
  },
  {
    slug: "open-source-invoice-generator",
    label: "Open-Source Invoice Generator - Free & Customizable",
  },
  {
    slug: "stripe-invoice-alternative",
    label: "Stripe Invoice Alternative - Easier & Faster",
  },
  {
    slug: "invoice-template-pdf",
    label: "Free PDF Invoice Templates - Professional & Downloadable",
  },
] as const satisfies {
  slug: SeoLandingSlug;
  label: string;
}[];
