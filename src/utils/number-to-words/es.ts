import { cardsToWords, type CardLanguage } from "./cards";

/**
 * Spanish counts in the long scale, so it has no card for 10^9 or 10^15: a billion is
 * 10^12 ("billón") and the gaps are spelled out as "mil millones" and so on.
 */
const SPANISH: CardLanguage = {
  cards: [
    [1_000_000, "millón"],
    [1000, "mil"],
    [100, "cien"],
    [90, "noventa"],
    [80, "ochenta"],
    [70, "setenta"],
    [60, "sesenta"],
    [50, "cincuenta"],
    [40, "cuarenta"],
    [30, "treinta"],
    [29, "veintinueve"],
    [28, "veintiocho"],
    [27, "veintisiete"],
    [26, "veintiséis"],
    [25, "veinticinco"],
    [24, "veinticuatro"],
    [23, "veintitrés"],
    [22, "veintidós"],
    [21, "veintiuno"],
    [20, "veinte"],
    [19, "diecinueve"],
    [18, "dieciocho"],
    [17, "diecisiete"],
    [16, "dieciseis"],
    [15, "quince"],
    [14, "catorce"],
    [13, "trece"],
    [12, "doce"],
    [11, "once"],
    [10, "diez"],
    [9, "nueve"],
    [8, "ocho"],
    [7, "siete"],
    [6, "seis"],
    [5, "cinco"],
    [4, "cuatro"],
    [3, "tres"],
    [2, "dos"],
    [1, "uno"],
    [0, "cero"],
  ],
  merge({ left, right }) {
    let leftText = left.text;
    let rightText = right.text;

    if (left.value === 1) {
      if (right.value < 1_000_000) {
        return right;
      }

      leftText = "un";
    } else if (left.value === 100 && right.value % 1000 !== 0) {
      // "cien" becomes "ciento" as soon as something follows it.
      leftText += "to";
    }

    if (right.value < left.value) {
      if (left.value < 100) {
        return {
          text: `${leftText} y ${rightText}`,
          value: left.value + right.value,
        };
      }

      return {
        text: `${leftText} ${rightText}`,
        value: left.value + right.value,
      };
    }

    if (right.value % 1_000_000 === 0 && left.value > 1) {
      rightText = `${rightText.slice(0, -3)}lones`;
    }

    if (right.value === 100) {
      // The hundreds are irregular: quinientos, setecientos, novecientos.
      if (left.value === 5) {
        leftText = "quinien";
        rightText = "";
      } else if (left.value === 7) {
        leftText = "sete";
      } else if (left.value === 9) {
        leftText = "nove";
      }

      rightText += "tos";
    } else {
      rightText = ` ${rightText}`;
    }

    return {
      text: `${leftText}${rightText}`,
      value: left.value * right.value,
    };
  },
};

export function toWords(value: number): string {
  return cardsToWords({ value, language: SPANISH });
}
