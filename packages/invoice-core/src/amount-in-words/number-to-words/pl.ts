/**
 * Polish vocabulary for the shared Slavic engine.
 *
 * Tables lifted from `n2words`' `pl.js`, which this replaces, with one correction: that
 * version misspells 90 as "dziewięćdzisiąt". No such Polish word exists -- every other ten
 * in the same table ends in "-dziesiąt" -- and upstream has since fixed it, so this is the
 * one place the wording deliberately departs from the package we replaced. It is not a
 * rare corner: 19% of the amounts below 100,000 contain a nine in the tens place.
 *
 * `n2words`' Polish class inherited the Russian one, so it also inherited a table of
 * Russian feminine units it never read; Polish thousands take the plain units
 * ("dwa tysiące"), so there is no `onesFeminine` here at all.
 */
import { slavicToWords, type SlavicLanguage } from "./slavic";

const POLISH: SlavicLanguage = {
  zero: "zero",
  ones: {
    1: "jeden",
    2: "dwa",
    3: "trzy",
    4: "cztery",
    5: "pięć",
    6: "sześć",
    7: "siedem",
    8: "osiem",
    9: "dziewięć",
  },
  teens: {
    0: "dziesięć",
    1: "jedenaście",
    2: "dwanaście",
    3: "trzynaście",
    4: "czternaście",
    5: "piętnaście",
    6: "szesnaście",
    7: "siedemnaście",
    8: "osiemnaście",
    9: "dziewiętnaście",
  },
  twenties: {
    2: "dwadzieścia",
    3: "trzydzieści",
    4: "czterdzieści",
    5: "pięćdziesiąt",
    6: "sześćdziesiąt",
    7: "siedemdziesiąt",
    8: "osiemdziesiąt",
    9: "dziewięćdziesiąt",
  },
  hundreds: {
    1: "sto",
    2: "dwieście",
    3: "trzysta",
    4: "czterysta",
    5: "pięćset",
    6: "sześćset",
    7: "siedemset",
    8: "osiemset",
    9: "dziewięćset",
  },
  scales: {
    1: ["tysiąc", "tysiące", "tysięcy"],
    2: ["milion", "miliony", "milionów"],
    3: ["miliard", "miliardy", "miliardów"],
  },
  omitOneBeforeScale: true,
  /**
   * Polish differs from its neighbours: only a bare 1 takes the singular, so 21 takes the
   * "many" form ("dwadzieścia jeden tysięcy") where Russian would take the singular.
   */
  pluralize({ count, forms }) {
    if (count === 1) {
      return forms[0];
    }

    const last = count % 10;
    const lastTwo = count % 100;

    if (last > 1 && last < 5 && (lastTwo < 10 || lastTwo > 20)) {
      return forms[1];
    }

    return forms[2];
  },
};

export function toWords(value: number): string {
  return slavicToWords({ value, language: POLISH });
}
