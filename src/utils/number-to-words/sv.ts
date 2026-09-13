import { cardsToWords, type CardLanguage } from "./cards";

const SWEDISH: CardLanguage = {
  cards: [
    [1_000_000_000, "miljard"],
    [1_000_000, "miljon"],
    [1000, "tusen"],
    [100, "hundra"],
    [90, "nittio"],
    [80, "åttio"],
    [70, "sjuttio"],
    [60, "sextio"],
    [50, "femtio"],
    [40, "fyrtio"],
    [30, "trettio"],
    [20, "tjugo"],
    [19, "nitton"],
    [18, "arton"],
    [17, "sjutton"],
    [16, "sexton"],
    [15, "femton"],
    [14, "fjorton"],
    [13, "tretton"],
    [12, "tolv"],
    [11, "elva"],
    [10, "tio"],
    [9, "nio"],
    [8, "åtta"],
    [7, "sju"],
    [6, "sex"],
    [5, "fem"],
    [4, "fyra"],
    [3, "tre"],
    [2, "två"],
    [1, "ett"],
    [0, "noll"],
  ],
  merge({ left, right }) {
    let leftText = left.text;
    const rightText = right.text;

    if (left.value === 1) {
      // "tusen" is neuter like "hundra", but `ett` + `tusen` would stack three t's, and
      // Swedish writes a tripled consonant as two: "ettusen", not "etttusen".
      if (right.value === 1000) {
        return { text: "ettusen", value: right.value };
      }

      if (right.value === 100) {
        return { text: `ett${rightText}`, value: right.value };
      }

      if (right.value < 1_000_000) {
        return right;
      }

      // "miljon" and "miljard" are common-gender nouns, so they take `en` rather than `ett`.
      leftText = "en";
    }

    if (right.value > left.value) {
      if (right.value >= 1_000_000) {
        return {
          // Both scale words pluralise the same way: miljon/miljoner, miljard/miljarder.
          text: `${leftText} ${left.value > 1 ? `${rightText}er` : rightText}`,
          value: left.value * right.value,
        };
      }

      return {
        text: `${leftText}${rightText}`,
        value: left.value * right.value,
      };
    }

    // Swedish reads the tens before the units -- "trettiofyra", not the Dutch and German
    // "four and thirty" -- so addition is a plain concatenation. Only the scale words stand
    // apart as their own words; everything below a million compounds into one.
    if (left.value >= 1_000_000) {
      leftText += " ";
    }

    return { text: `${leftText}${rightText}`, value: left.value + right.value };
  },
};

/**
 * Spell out a non-negative integer in Swedish.
 *
 * Everything below a million is written as a single word ("ettusentvåhundratrettiofyra");
 * `miljon` and `miljard` are nouns and stay separate, which is the only place a space
 * appears. Years read as hundreds -- 1100 as "elvahundra" -- are deliberately left out: on
 * an amount line the plain "ettusenetthundra" is the unambiguous reading.
 */
export function toWords(value: number): string {
  return cardsToWords({ value, language: SWEDISH });
}
