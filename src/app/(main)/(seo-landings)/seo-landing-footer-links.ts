import type { SeoLandingSlug } from "./seo-landing-definitions";

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
    label: "Free Invoice Generator - No Login Required",
  },
  {
    slug: "open-source-invoice-generator",
    label: "Open-Source Invoice Generator - Free and Self-Hostable",
  },
  {
    slug: "stripe-invoice-alternative",
    label: "Create a Stripe-Style Invoice Without Stripe",
  },
  {
    slug: "invoice-template-pdf",
    label: "Free Invoice Template - Fill It In and Download a PDF",
  },
  {
    slug: "multi-language-invoice-generator",
    label: "Invoice Generator in 12 Languages - Free PDF",
  },
  {
    slug: "swedish-invoice-generator",
    label: "Swedish Invoice Generator - Free PDF in SEK",
  },
  {
    slug: "norwegian-invoice-generator",
    label: "Norwegian Invoice Generator - Free PDF in NOK",
  },
] as const satisfies {
  slug: SeoLandingSlug;
  label: string;
}[];
