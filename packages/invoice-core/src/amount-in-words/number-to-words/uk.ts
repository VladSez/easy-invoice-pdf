/**
 * Ukrainian vocabulary for the shared Slavic engine.
 *
 * Tables lifted verbatim from `n2words`' `uk.js`, which this replaces -- including its
 * habit of spelling the Cyrillic "і" with a Latin "i". Kept as-is so the wording of an
 * already-issued invoice does not change underneath anyone.
 */
import {
  slavicToWords,
  eastSlavicPluralize,
  type SlavicLanguage,
} from "./slavic";

const UKRAINIAN: SlavicLanguage = {
  zero: "нуль",
  ones: {
    1: "один",
    2: "два",
    3: "три",
    4: "чотири",
    5: "п'ять",
    6: "шiсть",
    7: "сiм",
    8: "вiсiм",
    9: "дев'ять",
  },
  onesFeminine: {
    1: "одна",
    2: "двi",
    3: "три",
    4: "чотири",
    5: "п'ять",
    6: "шiсть",
    7: "сiм",
    8: "вiсiм",
    9: "дев'ять",
  },
  teens: {
    0: "десять",
    1: "одинадцять",
    2: "дванадцять",
    3: "тринадцять",
    4: "чотирнадцять",
    5: "п'ятнадцять",
    6: "шiстнадцять",
    7: "сiмнадцять",
    8: "вiсiмнадцять",
    9: "дев'ятнадцять",
  },
  twenties: {
    2: "двадцять",
    3: "тридцять",
    4: "сорок",
    5: "п'ятдесят",
    6: "шiстдесят",
    7: "сiмдесят",
    8: "вiсiмдесят",
    9: "дев'яносто",
  },
  hundreds: {
    1: "сто",
    2: "двiстi",
    3: "триста",
    4: "чотириста",
    5: "п'ятсот",
    6: "шiстсот",
    7: "сiмсот",
    8: "вiсiмсот",
    9: "дев'ятсот",
  },
  scales: {
    1: ["тисяча", "тисячi", "тисяч"],
    2: ["мiльйон", "мiльйони", "мiльйонiв"],
    3: ["мiльярд", "мiльярди", "мiльярдiв"],
  },
  omitOneBeforeScale: false,
  pluralize: eastSlavicPluralize,
};

export function toWords(value: number): string {
  return slavicToWords({ value, language: UKRAINIAN });
}
