import { describe, expect, it } from "vitest";

import {
  SEO_LANDING_DEFINITIONS,
  SEO_LANDING_SLUGS,
} from "../seo-landing-definitions";

/** The landings whose h1 carries a mark. */
const MARKED_HEROES = SEO_LANDING_SLUGS.flatMap((slug) => {
  const { hero } = SEO_LANDING_DEFINITIONS[slug];

  return "h1Mark" in hero ? [{ slug, h1: hero.h1, h1Mark: hero.h1Mark }] : [];
});

/**
 * Every marked text on the landings, as `[label, text, mark]` rows: the heroes' h1s and
 * the section headings of story landings.
 */
const MARKED_TEXTS = SEO_LANDING_SLUGS.flatMap((slug) => {
  const definition = SEO_LANDING_DEFINITIONS[slug];

  const { hero } = definition;

  const rows: [string, string, { phrase: string; type: string }][] = [];

  if ("h1Mark" in hero) {
    rows.push([`${slug} h1`, hero.h1, hero.h1Mark]);
  }

  if ("story" in definition) {
    for (const [section, copy] of Object.entries(definition.story)) {
      if (typeof copy === "object" && "headingMark" in copy) {
        rows.push([`${slug} ${section}`, copy.heading, copy.headingMark]);
      }
    }
  }

  return rows;
});

describe("hero marks on the SEO landings", () => {
  it.each(MARKED_TEXTS)("%s marks a phrase that is in it", (_, text, mark) => {
    expect(text).toContain(mark.phrase);
  });

  it("gives every landing its own h1 mark type and colour pairing", () => {
    const pairings = MARKED_HEROES.map(({ h1Mark: { type, color } }) => {
      return `${type} ${color}`;
    });

    expect(new Set(pairings).size).toBe(pairings.length);
  });
});

/**
 * See `h1Mark.phrase`: the mark's SVG sits before a highlight and after any other mark,
 * and counts as a word break in the text's accessible name there, so that side of the
 * phrase must already be whitespace (or the edge of the text).
 */
describe("hero mark phrases keep the text's accessible name intact", () => {
  it.each(MARKED_TEXTS)(
    "%s: whitespace or the edge of the text sits where the mark's SVG goes",
    (_, text, mark) => {
      if (mark.type === "highlight") {
        expect(` ${text}`).toContain(` ${mark.phrase}`);
      } else {
        expect(`${text} `).toContain(`${mark.phrase} `);
      }
    },
  );
});
