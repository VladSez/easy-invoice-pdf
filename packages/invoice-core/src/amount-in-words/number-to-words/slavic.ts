/**
 * The shared engine for Polish, Russian and Ukrainian.
 *
 * These languages read a number in groups of three digits, and each group picks its own
 * form of the scale word after it ("две тысячи" but "пять тысяч"), so they do not fit the
 * card model the other languages here use.
 *
 * Ported from `n2words`' `N2WordsRU`, which we had to drop -- see `./cards.ts` for why.
 */

/** A scale word in its three grammatical forms: one, a few, many. */
export type PluralForms = readonly [string, string, string];

export interface SlavicLanguage {
  /** The word for 0, used on its own. */
  zero: string;
  /** Units 1-9. */
  ones: Record<number, string>;
  /**
   * Units 1-9 in the feminine form the thousands take ("одна тысяча", "двi тисячi").
   *
   * Left out by languages whose thousands take the plain units instead ("dwa tysiące").
   * Absence is the signal, rather than a separate flag: a flag can be flipped on for a
   * language that never filled this table in, and the mistake shows up as words from the
   * wrong language rather than as a type error.
   */
  onesFeminine?: Record<number, string>;
  /** 10-19, keyed by the units digit. */
  teens: Record<number, string>;
  /** 20-90, keyed by the tens digit. */
  twenties: Record<number, string>;
  /** 100-900, keyed by the hundreds digit. */
  hundreds: Record<number, string>;
  /** Scale word per group, keyed by how many groups follow it (1 = thousands). */
  scales: Record<number, PluralForms>;
  /** Whether a group of exactly 1 drops its "one" before a scale word ("tysiąc"). */
  omitOneBeforeScale: boolean;
  /** Chooses the scale word's form for a group. */
  pluralize: (params: { count: number; forms: PluralForms }) => string;
}

/** Split a whole number into its three-digit groups, most significant first. */
function splitIntoGroups(value: number): number[] {
  const digits = String(value);
  const groups: number[] = [];

  const leading = digits.length % 3;

  if (leading > 0) {
    groups.push(Number(digits.slice(0, leading)));
  }

  for (let index = leading; index < digits.length; index += 3) {
    groups.push(Number(digits.slice(index, index + 3)));
  }

  return groups;
}

/** Spell out a non-negative integer in one of the Slavic languages. */
export function slavicToWords({
  value,
  language,
}: {
  value: number;
  language: SlavicLanguage;
}): string {
  if (value === 0) {
    return language.zero;
  }

  const words: string[] = [];
  const groups = splitIntoGroups(value);

  // How many groups follow this one -- 1 means thousands, 2 millions, and so on.
  let index = groups.length;

  for (const group of groups) {
    index -= 1;

    if (group === 0) {
      continue;
    }

    const units = group % 10;
    const tens = Math.floor(group / 10) % 10;
    const hundreds = Math.floor(group / 100) % 10;

    if (hundreds > 0) {
      words.push(language.hundreds[hundreds]);
    }

    if (tens > 1) {
      words.push(language.twenties[tens]);
    }

    if (tens === 1) {
      words.push(language.teens[units]);
    } else if (
      units > 0 &&
      !(language.omitOneBeforeScale && index > 0 && group === 1)
    ) {
      // Thousands are the only group that can call for a different set of units.
      const unitWords =
        index === 1 ? (language.onesFeminine ?? language.ones) : language.ones;

      words.push(unitWords[units]);
    }

    if (index > 0) {
      words.push(
        language.pluralize({ count: group, forms: language.scales[index] }),
      );
    }
  }

  return words.join(" ");
}

/**
 * The Russian and Ukrainian rule: singular after 1, the "few" form after 2-4, and the
 * "many" form otherwise -- except in the teens, which always take "many".
 */
export function eastSlavicPluralize({
  count,
  forms,
}: {
  count: number;
  forms: PluralForms;
}): string {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo < 10 || lastTwo > 20) {
    if (last === 1) {
      return forms[0];
    }

    if (last > 1 && last < 5) {
      return forms[1];
    }
  }

  return forms[2];
}
