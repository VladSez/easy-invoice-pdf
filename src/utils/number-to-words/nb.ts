import { cardsToWords, type CardLanguage } from "./cards";

const NORWEGIAN: CardLanguage = {
  cards: [
    [1_000_000_000, "milliard"],
    [1_000_000, "million"],
    [1000, "tusen"],
    [100, "hundre"],
    [90, "nitti"],
    [80, "åtti"],
    [70, "sytti"],
    [60, "seksti"],
    [50, "femti"],
    [40, "førti"],
    [30, "tretti"],
    [20, "tjue"],
    [19, "nitten"],
    [18, "atten"],
    [17, "sytten"],
    [16, "seksten"],
    [15, "femten"],
    [14, "fjorten"],
    [13, "tretten"],
    [12, "tolv"],
    [11, "elleve"],
    [10, "ti"],
    [9, "ni"],
    [8, "åtte"],
    [7, "sju"],
    [6, "seks"],
    [5, "fem"],
    [4, "fire"],
    [3, "tre"],
    [2, "to"],
    [1, "en"],
    [0, "null"],
  ],
  merge({ left, right }) {
    let leftText = left.text;
    const rightText = right.text;

    if (left.value === 1) {
      // "hundre" and "tusen" are neuter, so they count with `ett` rather than the bare `en`.
      if (right.value === 100 || right.value === 1000) {
        return { text: `ett ${rightText}`, value: right.value };
      }

      if (right.value < 1_000_000) {
        return right;
      }

      leftText = "en";
    }

    if (right.value > left.value) {
      if (right.value >= 1_000_000) {
        return {
          // million/millioner, milliard/milliarder.
          text: `${leftText} ${left.value > 1 ? `${rightText}er` : rightText}`,
          value: left.value * right.value,
        };
      }

      return {
        text: `${leftText} ${rightText}`,
        value: left.value * right.value,
      };
    }

    // Norwegian joins tens and units into one word -- "tjueen", "trettifire" -- but hangs
    // the last group under a hundred off the rest with `og`: "to hundre og trettifire".
    if (left.value < 100) {
      return {
        text: `${leftText}${rightText}`,
        value: left.value + right.value,
      };
    }

    const separator = right.value < 100 ? " og " : " ";

    return {
      text: `${leftText}${separator}${rightText}`,
      value: left.value + right.value,
    };
  },
};

/**
 * Spell out a non-negative integer in Norwegian Bokmål.
 *
 * Written in the spaced form ("ett tusen to hundre og trettifire"). Språkrådet permits both
 * this and the traditional run-together form ("ettusentohundreogtrettifire"); the spaced
 * form is chosen because it is more natural in modern Norwegian prose and stays easier to
 * read at the length an invoice total reaches.
 *
 * The modern `sju` and `tjue` are used rather than the older `syv` and `tyve`. Both remain
 * current, so this is a choice rather than a rule.
 */
export function toWords(value: number): string {
  return cardsToWords({ value, language: NORWEGIAN });
}
