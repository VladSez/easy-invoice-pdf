import { cardsToWords, type CardLanguage } from "./cards";

const HUNDREDS: Record<number, string | undefined> = {
  1: "cento",
  2: "duzentos",
  3: "trezentos",
  4: "quatrocentos",
  5: "quinhentos",
  6: "seiscentos",
  7: "setecentos",
  8: "oitocentos",
  9: "novecentos",
};

/**
 * Portuguese joins almost everything with "e", but drops it between a scale word and a
 * following hundreds word when yet another "e" comes later -- "mil duzentos e trinta",
 * not "mil e duzentos e trinta".
 */
const DROP_E_AFTER = ["mil", "milhão", "milhões", "bilhão", "bilhões"];

/**
 * Brazilian Portuguese, which differs from the European spelling in `./pt.ts` twice over.
 *
 * The teens are written with an "s" where Portugal writes a double one -- "dezesseis",
 * "dezessete", "dezenove" -- and 14 is "quatorze" rather than "catorze".
 *
 * More importantly Brazil counts on the short scale: 10^9 is "um bilhão", where Portugal
 * says "mil milhões" and saves "bilião" for 10^12. That is a difference in *value*, not in
 * spelling, so the two cannot share a table: the same invoice total would otherwise be
 * spelled out as a thousand times itself.
 */
const BRAZILIAN_PORTUGUESE: CardLanguage = {
  cards: [
    [1_000_000_000, "bilhão"],
    [1_000_000, "milhão"],
    [1000, "mil"],
    [100, "cem"],
    [90, "noventa"],
    [80, "oitenta"],
    [70, "setenta"],
    [60, "sessenta"],
    [50, "cinquenta"],
    [40, "quarenta"],
    [30, "trinta"],
    [20, "vinte"],
    [19, "dezenove"],
    [18, "dezoito"],
    [17, "dezessete"],
    [16, "dezesseis"],
    [15, "quinze"],
    [14, "quatorze"],
    [13, "treze"],
    [12, "doze"],
    [11, "onze"],
    [10, "dez"],
    [9, "nove"],
    [8, "oito"],
    [7, "sete"],
    [6, "seis"],
    [5, "cinco"],
    [4, "quatro"],
    [3, "três"],
    [2, "dois"],
    [1, "um"],
    [0, "zero"],
  ],
  merge({ left, right }) {
    let leftText = left.text;
    let rightText = right.text;

    if (left.value === 1) {
      if (right.value < 1_000_000) {
        return right;
      }

      leftText = "um";
    } else if (left.value === 100 && right.value % 1000 !== 0) {
      leftText = "cento";
    }

    if (right.value < left.value) {
      return {
        text: `${leftText} e ${rightText}`,
        value: left.value + right.value,
      };
    }

    // "dois milhão" -> "dois milhões". Only the scale words end in "-ão" here, so this
    // cannot catch anything else.
    if (right.value >= 1_000_000 && left.value > 1) {
      rightText = `${rightText.slice(0, -2)}ões`;
    }

    if (right.value === 100) {
      leftText = HUNDREDS[left.value] ?? leftText;
      rightText = "";
    } else {
      rightText = ` ${rightText}`;
    }

    return {
      text: `${leftText}${rightText}`,
      value: left.value * right.value,
    };
  },
  postClean(words) {
    let out = words;

    for (const scale of DROP_E_AFTER) {
      if (new RegExp(`.*${scale} e \\w*entos? (?=.*e)`).test(out)) {
        // oxlint-disable-next-line unicorn/prefer-string-replace-all -- `String#replaceAll` is Safari 13.1; `.browserslistrc` targets Safari 12, and SWC lowers syntax but never polyfills a built-in
        out = out.replace(new RegExp(`${scale} e`, "g"), scale);
      }
    }

    return out;
  },
};

export function toWords(value: number): string {
  return cardsToWords({ value, language: BRAZILIAN_PORTUGUESE });
}
