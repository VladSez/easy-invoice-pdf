/**
 * The attribute that marks the hero CTA the sticky bar stands down for.
 *
 * Only the hero carries it. The bar used to hide for every CTA on the page, which meant
 * it came and went three times on the way down; now the hero is the one place it is not
 * wanted, and past it the bar simply stays.
 *
 * This lives outside `sticky-seo-cta.tsx` on purpose. That file is `"use client"`, and a
 * server component importing a value from a client module gets a client-reference stub
 * rather than the object, so spreading it there renders no attribute at all.
 */
export const seoHeroCtaMarker = { "data-seo-hero-cta": "" } as const;

/** Selector for the CTA carrying {@link seoHeroCtaMarker}. */
export const SEO_HERO_CTA_SELECTOR = "[data-seo-hero-cta]";
