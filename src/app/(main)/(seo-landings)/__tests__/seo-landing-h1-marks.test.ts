import { describe, expect, it } from "vitest";

import {
  SEO_LANDING_DEFINITIONS,
  SEO_LANDING_SLUGS,
} from "../seo-landing-definitions";

/**
 * The landings whose h1 carries a mark. Story landings draw a scene of the app in the
 * hero instead, and have none.
 */
const MARKED_HEROES = SEO_LANDING_SLUGS.flatMap((slug) => {
  const { hero } = SEO_LANDING_DEFINITIONS[slug];

  return "h1Mark" in hero ? [{ slug, h1: hero.h1, h1Mark: hero.h1Mark }] : [];
});

const MARKED_SLUGS = MARKED_HEROES.map(({ slug }) => {
  return slug;
});

describe("h1 marks on the SEO landings", () => {
  it.each(MARKED_SLUGS)("%s marks a phrase that is in its h1", (slug) => {
    const { h1, h1Mark } = markedHero(slug);

    expect(h1).toContain(h1Mark.phrase);
  });

  it("gives every landing its own mark type and colour pairing", () => {
    const pairings = MARKED_HEROES.map(({ h1Mark: { type, color } }) => {
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
      const { h1, h1Mark } = markedHero(slug);

      expect(` ${h1}`).toContain(` ${h1Mark.phrase}`);
    },
  );

  it.each(slugsMarkedWith("underline"))(
    "%s: a space or the end of the heading comes after the underline",
    (slug) => {
      const { h1, h1Mark } = markedHero(slug);

      expect(`${h1} `).toContain(`${h1Mark.phrase} `);
    },
  );
});

function slugsMarkedWith(type: "highlight" | "underline") {
  return MARKED_HEROES.filter(({ h1Mark }) => {
    return h1Mark.type === type;
  }).map(({ slug }) => {
    return slug;
  });
}

function markedHero(slug: string) {
  const hero = MARKED_HEROES.find((entry) => {
    return entry.slug === slug;
  });

  if (!hero) {
    throw new Error(`No marked hero for ${slug}`);
  }

  return hero;
}
