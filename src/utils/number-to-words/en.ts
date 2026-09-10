import { cardsToWords, type CardLanguage } from "./cards";

const ENGLISH: CardLanguage = {
  cards: [
    [1_000_000_000, "billion"],
    [1_000_000, "million"],
    [1000, "thousand"],
    [100, "hundred"],
    [90, "ninety"],
    [80, "eighty"],
    [70, "seventy"],
    [60, "sixty"],
    [50, "fifty"],
    [40, "forty"],
    [30, "thirty"],
    [20, "twenty"],
    [19, "nineteen"],
    [18, "eighteen"],
    [17, "seventeen"],
    [16, "sixteen"],
    [15, "fifteen"],
    [14, "fourteen"],
    [13, "thirteen"],
    [12, "twelve"],
    [11, "eleven"],
    [10, "ten"],
    [9, "nine"],
    [8, "eight"],
    [7, "seven"],
    [6, "six"],
    [5, "five"],
    [4, "four"],
    [3, "three"],
    [2, "two"],
    [1, "one"],
    [0, "zero"],
  ],
  merge({ left, right }) {
    if (left.value === 1 && right.value < 100) {
      return right;
    }

    if (left.value < 100 && left.value > right.value) {
      return {
        text: `${left.text}-${right.text}`,
        value: left.value + right.value,
      };
    }

    if (left.value >= 100 && right.value < 100) {
      return {
        text: `${left.text} and ${right.text}`,
        value: left.value + right.value,
      };
    }

    if (right.value > left.value) {
      return {
        text: `${left.text} ${right.text}`,
        value: left.value * right.value,
      };
    }

    return {
      text: `${left.text} ${right.text}`,
      value: left.value + right.value,
    };
  },
};

export function toWords(value: number): string {
  return cardsToWords({ value, language: ENGLISH });
}
