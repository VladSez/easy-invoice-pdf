// oxlint-disable unicorn/prefer-string-replace-all -- `String#replaceAll` is Safari 13.1; `.browserslistrc` targets Safari 12, and SWC lowers syntax but never polyfills a built-in

/**
 * Italian does not fit the card model the other European languages here share: it writes
 * numbers as one unbroken word and elides vowels where they collide, so it gets its own
 * digit-by-digit construction.
 */

const ZERO = "zero";

const CARDINAL_WORDS = [
  ZERO,
  "uno",
  "due",
  "tre",
  "quattro",
  "cinque",
  "sei",
  "sette",
  "otto",
  "nove",
  "dieci",
  "undici",
  "dodici",
  "tredici",
  "quattordici",
  "quindici",
  "sedici",
  "diciassette",
  "diciotto",
  "diciannove",
];

/** The tens that are not formed by the regular "-anta" suffix. */
const IRREGULAR_TENS: Record<number, string | undefined> = {
  2: "venti",
  3: "trenta",
  4: "quaranta",
  6: "sessanta",
};

/**
 * Italian builds its scale words from a prefix plus "-ilione"/"-iliardo": "m" gives
 * milione and miliardo. Only "m" is reachable, because `numberToWords` refuses anything
 * from 10^12 up -- the next prefix would start spelling out biliardi and beyond.
 */
const EXPONENT_PREFIXES = [ZERO, "m"];

/** Only "tre" at the end of a longer word takes the accent: "ventitré", but "tre". */
function accentuate(words: string): string {
  return words
    .split(" ")
    .map((word) => {
      const plain = word.replace(/tré/g, "tre");

      return word.endsWith("tre") && word.length > 3
        ? `${plain.slice(0, -3)}tré`
        : plain;
    })
    .join(" ");
}

function omitIfZero(words: string): string {
  return words === ZERO ? "" : words;
}

/** Italian drops the first of two colliding vowels: "venti" + "otto" becomes "ventotto". */
function phoneticContraction(words: string): string {
  return words
    .replace(/oo/g, "o")
    .replace(/ao/g, "o")
    .replace(/io/g, "o")
    .replace(/au/g, "u")
    .replace(/iu/g, "u");
}

function tensToWords(value: number): string {
  const tens = Math.floor(value / 10);
  const units = value % 10;

  // "cinque" -> "cinquanta", "otto" -> "ottanta", and so on for the regular tens.
  const prefix =
    IRREGULAR_TENS[tens] ?? `${CARDINAL_WORDS[tens].slice(0, -1)}anta`;

  return phoneticContraction(`${prefix}${omitIfZero(CARDINAL_WORDS[units])}`);
}

function hundredsToWords(value: number): string {
  const hundreds = Math.floor(value / 100);
  const prefix = hundreds === 1 ? "cento" : `${CARDINAL_WORDS[hundreds]}cento`;

  return phoneticContraction(`${prefix}${omitIfZero(toCardinal(value % 100))}`);
}

function thousandsToWords(value: number): string {
  const thousands = Math.floor(value / 1000);
  const prefix = thousands === 1 ? "mille" : `${toCardinal(thousands)}mila`;

  return `${prefix}${omitIfZero(toCardinal(value % 1000))}`;
}

function exponentLengthToWords(exponentLength: number): string {
  const prefix = EXPONENT_PREFIXES[Math.floor(exponentLength / 6)];

  return exponentLength % 6 === 0 ? `${prefix}ilione` : `${prefix}iliardo`;
}

function bigNumberToWords(value: number): string {
  const digits = String(value).split("");

  const leadingCount = digits.length % 3 === 0 ? 3 : digits.length % 3;
  const multiplier = digits.slice(0, leadingCount).join("");
  const exponent = digits.slice(leadingCount).join("");

  let prefix: string;
  let infix = exponentLengthToWords(exponent.length);

  if (multiplier === "1") {
    prefix = "un ";
  } else {
    prefix = toCardinal(Math.trunc(Number(multiplier)));
    infix = ` ${infix.slice(0, -1)}i`;
  }

  const hasRemainder = /[1-9]/.test(exponent);

  if (!hasRemainder) {
    return `${prefix}${infix}`;
  }

  const postfix = toCardinal(Math.trunc(Number(exponent)));

  return `${prefix}${infix}${postfix.includes(" e ") ? ", " : " e "}${postfix}`;
}

function toCardinal(value: number): string {
  if (value < 20) {
    return accentuate(CARDINAL_WORDS[value]);
  }

  if (value < 100) {
    return accentuate(tensToWords(value));
  }

  if (value < 1000) {
    return accentuate(hundredsToWords(value));
  }

  if (value < 1_000_000) {
    return accentuate(thousandsToWords(value));
  }

  return accentuate(bigNumberToWords(value));
}

export function toWords(value: number): string {
  return toCardinal(value);
}
