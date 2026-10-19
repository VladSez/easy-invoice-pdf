import { cardsToWords, type CardLanguage } from "./cards";

/** `String.prototype.at` is Safari 15.4, which is newer than the browsers we target. */
function lastCharacter(text: string): string {
  // oxlint-disable-next-line unicorn/prefer-at -- `.at()` is Safari 15.4; `.browserslistrc` targets Safari 12, and SWC lowers syntax but never polyfills a built-in
  return text.charAt(text.length - 1);
}

const FRENCH: CardLanguage = {
  cards: [
    [1_000_000_000, "milliard"],
    [1_000_000, "million"],
    [1000, "mille"],
    [100, "cent"],
    [80, "quatre-vingts"],
    [60, "soixante"],
    [50, "cinquante"],
    [40, "quarante"],
    [30, "trente"],
    [20, "vingt"],
    [19, "dix-neuf"],
    [18, "dix-huit"],
    [17, "dix-sept"],
    [16, "seize"],
    [15, "quinze"],
    [14, "quatorze"],
    [13, "treize"],
    [12, "douze"],
    [11, "onze"],
    [10, "dix"],
    [9, "neuf"],
    [8, "huit"],
    [7, "sept"],
    [6, "six"],
    [5, "cinq"],
    [4, "quatre"],
    [3, "trois"],
    [2, "deux"],
    [1, "un"],
    [0, "zéro"],
  ],
  merge({ left, right }) {
    let leftText = left.text;
    let rightText = right.text;

    if (left.value === 1) {
      if (right.value < 1_000_000) {
        return right;
      }
    } else {
      // "quatre-vingts" drops its s before another number: "quatre-vingt-un".
      if (
        ((left.value - 80) % 100 === 0 ||
          (left.value % 100 === 0 && left.value < 1000)) &&
        right.value < 1_000_000 &&
        lastCharacter(leftText) === "s"
      ) {
        leftText = leftText.slice(0, -1);
      }

      // ...and "cent" gains one when it is itself multiplied: "deux cents".
      if (
        left.value < 1000 &&
        right.value !== 1000 &&
        lastCharacter(rightText) !== "s" &&
        right.value % 100 === 0
      ) {
        rightText += "s";
      }
    }

    if (right.value < left.value && left.value < 100) {
      if (right.value % 10 === 1 && left.value !== 80) {
        return {
          text: `${leftText} et ${rightText}`,
          value: left.value + right.value,
        };
      }

      return {
        text: `${leftText}-${rightText}`,
        value: left.value + right.value,
      };
    }

    if (right.value > left.value) {
      return {
        text: `${leftText} ${rightText}`,
        value: left.value * right.value,
      };
    }

    return {
      text: `${leftText} ${rightText}`,
      value: left.value + right.value,
    };
  },
};

export function toWords(value: number): string {
  return cardsToWords({ value, language: FRENCH });
}
