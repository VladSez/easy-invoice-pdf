import { describe, expect, it } from "vitest";

import {
  SEO_LANDING_DEFINITIONS,
  SEO_LANDING_SLUGS,
} from "../seo-landing-definitions";
import { SEO_FOOTER_SOLUTION_LINKS } from "../seo-landing-footer-links";

describe("related landing links", () => {
  const footerSlugs = new Set<string>(
    SEO_FOOTER_SOLUTION_LINKS.map(({ slug }) => {
      return slug;
    }),
  );

  it.each(SEO_LANDING_SLUGS)(
    "%s links to other landings, once each",
    (slug) => {
      const { relatedSlugs } = SEO_LANDING_DEFINITIONS[slug];

      expect(relatedSlugs.length).toBeGreaterThan(0);
      expect(relatedSlugs).not.toContain(slug);
      expect(new Set(relatedSlugs).size).toBe(relatedSlugs.length);
    },
  );

  it("has a footer label for every landing, which the related block uses as anchor text", () => {
    expect(
      SEO_LANDING_SLUGS.filter((slug) => {
        return !footerSlugs.has(slug);
      }),
    ).toEqual([]);
  });

  it("links every landing from at least one other landing", () => {
    const linked = new Set(
      Object.values(SEO_LANDING_DEFINITIONS).flatMap(({ relatedSlugs }) => {
        return [...relatedSlugs];
      }),
    );

    expect(
      SEO_LANDING_SLUGS.filter((slug) => {
        return !linked.has(slug);
      }),
    ).toEqual([]);
  });
});
