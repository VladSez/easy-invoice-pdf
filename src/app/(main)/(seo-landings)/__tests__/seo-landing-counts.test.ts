import { describe, expect, it } from "vitest";

import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_INVOICE_PDF_LANGUAGES,
} from "@/app/schema";

import { SEO_LANDING_DEFINITIONS } from "../seo-landing-definitions";
import {
  APP_FOOTER_SOLUTION_LINKS,
  SEO_FOOTER_SOLUTION_LINKS,
} from "../seo-landing-footer-links";

/**
 * The landing copy states how many languages and currencies the PDF supports, in prose
 * ("13 languages"), in facts and comparison tables ("Languages on the PDF: 13") and in the
 * footer anchors. Those numbers are typed by hand, and adding a language to the schema
 * left five of them saying 12 -- so they are checked against the schema here.
 */
const EXPECTED_COUNTS = {
  languages: SUPPORTED_INVOICE_PDF_LANGUAGES.length,
  currencies: SUPPORTED_CURRENCIES.length,
} as const;

type CountedThing = keyof typeof EXPECTED_COUNTS;

interface CountClaim {
  /** Where the claim was found, e.g. `stripe-invoice-alternative.factsTable.rows[5]`. */
  where: string;
  thing: CountedThing;
  count: number;
}

describe("language and currency counts in the SEO copy", () => {
  const claims = [
    ...Object.entries(SEO_LANDING_DEFINITIONS).flatMap(([slug, definition]) => {
      return collectCountClaims({ value: definition, where: slug });
    }),
    ...[...APP_FOOTER_SOLUTION_LINKS, ...SEO_FOOTER_SOLUTION_LINKS].flatMap(
      ({ label }) => {
        return collectCountClaims({ value: label, where: `footer "${label}"` });
      },
    ),
  ];

  it.each(Object.keys(EXPECTED_COUNTS) as CountedThing[])(
    "finds the %s claims it checks",
    (thing) => {
      // guards the scan itself: if the copy is restructured and nothing matches any more,
      // the test below would pass on an empty list
      expect(claimsAbout({ claims, thing }).length).toBeGreaterThan(5);
    },
  );

  it.each(Object.keys(EXPECTED_COUNTS) as CountedThing[])(
    "states the real number of %s everywhere",
    (thing) => {
      expect(
        claimsAbout({ claims, thing }).filter(({ count }) => {
          return count !== EXPECTED_COUNTS[thing];
        }),
      ).toEqual([]);
    },
  );
});

interface ClaimsAboutParams {
  claims: CountClaim[];
  thing: CountedThing;
}

function claimsAbout({ claims, thing }: ClaimsAboutParams) {
  return claims.filter((claim) => {
    return claim.thing === thing;
  });
}

interface CollectCountClaimsParams {
  value: unknown;
  /** Path to `value`, for the failure message. */
  where: string;
}

/**
 * Walks the landing copy and returns every number it states for languages or currencies:
 * "13 languages" in any string, and the number in a table row labelled with the thing
 * ("Languages on the PDF" -> "✅ 13").
 *
 * Embedded videos are skipped: their title and description are the published YouTube
 * metadata (one says "10 languages"), not copy we can keep current.
 *
 * @returns The claims found in `value` and everything below it.
 */
function collectCountClaims({
  value,
  where,
}: CollectCountClaimsParams): CountClaim[] {
  if (typeof value === "string") {
    return [...value.matchAll(/(\d+)\s+(languages|currencies)\b/gi)].map(
      ([, count, thing]) => {
        return {
          where,
          thing: thing.toLowerCase() as CountedThing,
          count: Number(count),
        };
      },
    );
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => {
      return collectCountClaims({ value: item, where: `${where}[${index}]` });
    });
  }

  if (typeof value !== "object" || value === null) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const claims: CountClaim[] = [];

  // a table row: { label | feature: "Languages on the PDF", value | thisTool: "✅ 13" }
  const rowLabel = record.label ?? record.feature;
  const rowValue = record.value ?? record.thisTool;

  if (typeof rowLabel === "string" && typeof rowValue === "string") {
    const thing = /languages/i.test(rowLabel)
      ? "languages"
      : /currencies/i.test(rowLabel)
        ? "currencies"
        : null;
    const count = /\d+/.exec(rowValue)?.[0];

    if (thing && count) {
      claims.push({ where, thing, count: Number(count) });
    }
  }

  for (const [key, child] of Object.entries(record)) {
    if (key === "heroVideo" || key === "video") {
      continue;
    }

    claims.push(
      ...collectCountClaims({ value: child, where: `${where}.${key}` }),
    );
  }

  return claims;
}
