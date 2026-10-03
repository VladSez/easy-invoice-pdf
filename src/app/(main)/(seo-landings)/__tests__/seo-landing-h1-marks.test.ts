import { describe, expect, it } from "vitest";

import {
  SEO_LANDING_DEFINITIONS,
  SEO_LANDING_SLUGS,
} from "../seo-landing-definitions";

describe("h1 marks on the SEO landings", () => {
  it.each(SEO_LANDING_SLUGS)("%s marks a phrase that is in its h1", (slug) => {
    const { h1, h1Mark } = SEO_LANDING_DEFINITIONS[slug].hero;

    expect(h1).toContain(h1Mark.phrase);
  });

  it("gives every landing its own mark type and colour pairing", () => {
    const pairings = SEO_LANDING_SLUGS.map((slug) => {
      const { type, color } = SEO_LANDING_DEFINITIONS[slug].hero.h1Mark;
      return `${type} ${color}`;
    });

    expect(new Set(pairings).size).toBe(pairings.length);
  });
});

/**
 * See `h1Mark.phrase`: the mark's SVG sits before a highlight and after an underline, and
 * counts as a word break in the heading's accessible name there, so that side of the
 * phrase must already be whitespace (or the edge of the heading).
 */
describe("h1 mark phrases keep the heading's accessible name intact", () => {
  it.each(slugsMarkedWith("highlight"))(
    "%s: a space or the start of the heading comes before the highlight",
    (slug) => {
      const { h1, h1Mark } = SEO_LANDING_DEFINITIONS[slug].hero;

      expect(` ${h1}`).toContain(` ${h1Mark.phrase}`);
    },
  );

  it.each(slugsMarkedWith("underline"))(
    "%s: a space or the end of the heading comes after the underline",
    (slug) => {
      const { h1, h1Mark } = SEO_LANDING_DEFINITIONS[slug].hero;

      expect(`${h1} `).toContain(`${h1Mark.phrase} `);
    },
  );
});

function slugsMarkedWith(type: "highlight" | "underline") {
  return SEO_LANDING_SLUGS.filter((slug) => {
    return SEO_LANDING_DEFINITIONS[slug].hero.h1Mark.type === type;
  });
}
