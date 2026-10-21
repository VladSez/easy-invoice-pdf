import { cardsToWords, type CardLanguage } from "./cards";

const DUTCH: CardLanguage = {
  cards: [
    [1_000_000_000, "miljard"],
    [1_000_000, "miljoen"],
    [1000, "duizend"],
    [100, "honderd"],
    [90, "negentig"],
    [80, "tachtig"],
    [70, "zeventig"],
    [60, "zestig"],
    [50, "vijftig"],
    [40, "veertig"],
    [30, "dertig"],
    [20, "twintig"],
    [19, "negentien"],
    [18, "achttien"],
    [17, "zeventien"],
    [16, "zestien"],
    [15, "vijftien"],
    [14, "veertien"],
    [13, "dertien"],
    [12, "twaalf"],
    [11, "elf"],
    [10, "tien"],
    [9, "negen"],
    [8, "acht"],
    [7, "zeven"],
    [6, "zes"],
    [5, "vijf"],
    [4, "vier"],
    [3, "drie"],
    [2, "twee"],
    [1, "een"],
    [0, "nul"],
  ],
  merge({ left, right }) {
    let leftText = left.text;
    let rightText = right.text;

    if (left.value === 1) {
      if (right.value < 1_000_000) {
        return right;
      }

      leftText = "een";
    }

    if (right.value > left.value) {
      if (right.value >= 1_000_000) {
        leftText += " ";
      } else if (right.value > 100) {
        rightText += " ";
      }

      return {
        text: `${leftText}${rightText}`,
        value: left.value * right.value,
      };
    }

    if (right.value < 10 && left.value > 10 && left.value < 100) {
      // Dutch says the units before the tens: "vierendertig", literally "four and thirty".
      const units = rightText;

      rightText = leftText;
      leftText = `${units}${units.endsWith("e") ? "ën" : "en"}`;
    } else if (left.value >= 1_000_000 || left.value === 1000) {
      leftText += " ";
    }

    return { text: `${leftText}${rightText}`, value: left.value + right.value };
  },
};

/**
 * Spell out a non-negative integer in Dutch.
 *
 * Between 1100 and 9999 Dutch prefers counting in hundreds -- 1234 is "twaalfhonderd
 * vierendertig", twelve hundred thirty-four -- so long as the hundreds part is not a round
 * multiple of ten ("tweeduizend", not "twintighonderd").
 */
export function toWords(value: number): string {
  if (value >= 1100 && value < 10_000) {
    const hundreds = Math.floor(value / 100);
    const rest = value % 100;

    if (hundreds % 10 !== 0) {
      const spelledRest =
        rest === 0 ? "" : ` ${cardsToWords({ value: rest, language: DUTCH })}`;

      return `${cardsToWords({ value: hundreds, language: DUTCH })}honderd${spelledRest}`;
    }
  }

  return cardsToWords({ value, language: DUTCH });
}
