import type { SeoLandingSlug } from "../seo-landing-definitions";

interface SeoCtaClickEventParams {
  /** The landing the CTA is on. */
  slug: SeoLandingSlug;
  /** Which of the landing's in-page CTAs was pressed. */
  position: "hero" | "inline" | "bottom";
}

/**
 * The analytics event for a click on one of a landing's in-page CTAs, which open the app.
 *
 * `seo_sticky_cta_clicked` covers the sticky bar; together they show how many readers of a
 * landing go on to the generator, to set against `seo_landing_file_downloaded` on pages
 * that offer a file.
 */
export function seoCtaClickEvent({ slug, position }: SeoCtaClickEventParams) {
  return {
    event: "seo_landing_cta_clicked",
    data: { slug, position },
  } as const;
}
