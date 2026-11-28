import { cardsToWords, type CardLanguage } from "./cards";

const GERMAN: CardLanguage = {
  cards: [
    [1_000_000_000, "Milliarde"],
    [1_000_000, "Million"],
    [1000, "tausend"],
    [100, "hundert"],
    [90, "neunzig"],
    [80, "achtzig"],
    [70, "siebzig"],
    [60, "sechzig"],
    [50, "fünfzig"],
    [40, "vierzig"],
    [30, "dreißig"],
    [20, "zwanzig"],
    [19, "neunzehn"],
    [18, "achtzehn"],
    [17, "siebzehn"],
    [16, "sechzehn"],
    [15, "fünfzehn"],
    [14, "vierzehn"],
    [13, "dreizehn"],
    [12, "zwölf"],
    [11, "elf"],
    [10, "zehn"],
    [9, "neun"],
    [8, "acht"],
    [7, "sieben"],
    [6, "sechs"],
    [5, "fünf"],
    [4, "vier"],
    [3, "drei"],
    [2, "zwei"],
    [1, "eins"],
    [0, "null"],
  ],
  merge({ left, right }) {
    let leftText = left.text;
    let rightText = right.text;

    if (left.value === 1) {
      if (right.value === 100 || right.value === 1000) {
        return { text: `ein${rightText}`, value: right.value };
      }

      if (right.value < 1_000_000) {
        return right;
      }

      leftText = "eine";
    }

    if (right.value > left.value) {
      if (right.value >= 1_000_000) {
        if (left.value > 1) {
          rightText += rightText.endsWith("e") ? "n" : "en";
        }

        leftText += " ";
      }

      return {
        text: `${leftText}${rightText}`,
        value: left.value * right.value,
      };
    }

    if (right.value < 10 && left.value > 10 && left.value < 100) {
      // German says the units before the tens: "vierundzwanzig", literally "four and twenty".
      const units = right.value === 1 ? "ein" : rightText;

      rightText = leftText;
      leftText = `${units}und`;
    } else if (left.value >= 1_000_000) {
      leftText += " ";
    }

    return { text: `${leftText}${rightText}`, value: left.value + right.value };
  },
};

export function toWords(value: number): string {
  return cardsToWords({ value, language: GERMAN });
}
