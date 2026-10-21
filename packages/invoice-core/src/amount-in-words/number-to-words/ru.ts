/**
 * Russian vocabulary for the shared Slavic engine.
 *
 * Tables lifted verbatim from `n2words`' `ru.js`, which this replaces.
 */
import {
  slavicToWords,
  eastSlavicPluralize,
  type SlavicLanguage,
} from "./slavic";

const RUSSIAN: SlavicLanguage = {
  zero: "ноль",
  ones: {
    1: "один",
    2: "два",
    3: "три",
    4: "четыре",
    5: "пять",
    6: "шесть",
    7: "семь",
    8: "восемь",
    9: "девять",
  },
  onesFeminine: {
    1: "одна",
    2: "две",
    3: "три",
    4: "четыре",
    5: "пять",
    6: "шесть",
    7: "семь",
    8: "восемь",
    9: "девять",
  },
  teens: {
    0: "десять",
    1: "одиннадцать",
    2: "двенадцать",
    3: "тринадцать",
    4: "четырнадцать",
    5: "пятнадцать",
    6: "шестнадцать",
    7: "семнадцать",
    8: "восемнадцать",
    9: "девятнадцать",
  },
  twenties: {
    2: "двадцать",
    3: "тридцать",
    4: "сорок",
    5: "пятьдесят",
    6: "шестьдесят",
    7: "семьдесят",
    8: "восемьдесят",
    9: "девяносто",
  },
  hundreds: {
    1: "сто",
    2: "двести",
    3: "триста",
    4: "четыреста",
    5: "пятьсот",
    6: "шестьсот",
    7: "семьсот",
    8: "восемьсот",
    9: "девятьсот",
  },
  scales: {
    1: ["тысяча", "тысячи", "тысяч"],
    2: ["миллион", "миллиона", "миллионов"],
    3: ["миллиард", "миллиарда", "миллиардов"],
  },
  omitOneBeforeScale: false,
  pluralize: eastSlavicPluralize,
};

export function toWords(value: number): string {
  return slavicToWords({ value, language: RUSSIAN });
}
