/**
 * The "highest matching card" engine that most European languages here are built on.
 *
 * A language supplies a table of cards -- a number and the word for it, highest first --
 * and a `merge` that says how two adjacent pieces join up. The engine repeatedly takes the
 * largest card that fits, recurses on how many of it there are, and then folds the whole
 * (nested) list back into a single phrase with `merge`.
 *
 * Ported from `n2words`' `BaseLanguage`, which we had to drop: it stores its cards as BigInt
 * literals, and BigInt is Safari 14+ syntax that no transpiler can lower, so the whole chunk
 * failed to parse on older iOS. See `./index.ts` for the range this works over.
 */

/** Words paired with the number they currently spell out. */
interface WordValue {
  /** The words accumulated so far, e.g. `"one hundred"`. */
  text: string;
  /** The number those words spell out, e.g. `100`. */
  value: number;
}

/** A number and the word for it, e.g. `[100, "hundred"]`. */
type NumberCard = readonly [number, string];

/** Everything a card-based language has to provide. */
export interface CardLanguage {
  /**
   * Cards from highest to lowest. Must include a card for `1` and end with one for `0`,
   * so that every non-negative value matches something.
   */
  cards: readonly NumberCard[];
  /** Joins two neighbouring pieces into one, applying the language's grammar. */
  merge: (parts: { left: WordValue; right: WordValue }) => WordValue;
  /** Last pass over the finished string. Defaults to trimming trailing space. */
  postClean?: (words: string) => string;
}

/** Either a finished piece or a nested group of them, mirroring how the engine recurses. */
type CardMatch = WordValue | CardMatch[];

function isGroup(match: CardMatch): match is CardMatch[] {
  return Array.isArray(match);
}

function findCard({
  cards,
  remaining,
}: {
  cards: readonly NumberCard[];
  remaining: number;
}): NumberCard {
  const card = cards.find(([number]) => {
    return remaining >= number;
  });

  if (!card) {
    // Only reachable if a language's table is missing its `0` card.
    throw new Error(`No card matches ${remaining}.`);
  }

  return card;
}

function wordForOne(cards: readonly NumberCard[]): string {
  const card = cards.find(([number]) => {
    return number === 1;
  });

  if (!card) {
    throw new Error("Language is missing a card for 1.");
  }

  return card[1];
}

/**
 * Break a value into the nested list of card matches that spell it out.
 *
 * `1234` becomes, roughly, `[[one], [thousand], [two, hundred], [thirty], [four]]` -- the
 * quantity of each card is itself run through the engine, which is where the nesting and
 * the recursion come from.
 */
function toCardMatches({
  value,
  cards,
}: {
  value: number;
  cards: readonly NumberCard[];
}): CardMatch[] {
  const out: CardMatch[] = [];
  let remaining = value;

  do {
    const card = findCard({ cards, remaining });
    const [cardNumber, cardWord] = card;

    let quantity: number;

    if (remaining === 0) {
      // Zero would make the division below meaningless, so short-circuit it.
      quantity = 1;
      remaining = 0;
    } else {
      quantity = Math.floor(remaining / cardNumber);
      remaining = remaining % cardNumber;
    }

    if (quantity === 1) {
      out.push({ text: wordForOne(cards), value: 1 });
    } else {
      out.push(toCardMatches({ value: quantity, cards }));
    }

    out.push({ text: cardWord, value: cardNumber });
  } while (remaining > 0);

  return out;
}

/**
 * Fold the nested match list down to a single piece.
 *
 * Each pass either merges the leading pair (when both are finished pieces) or flattens one
 * level of nesting, until a single piece is left.
 */
function collapse({
  matches,
  merge,
}: {
  matches: CardMatch[];
  merge: CardLanguage["merge"];
}): CardMatch {
  let words = matches;
  let out: CardMatch[] = matches;

  while (words.length !== 1) {
    out = [];

    const left = words[0];
    const right = words[1];

    if (left && right && !isGroup(left) && !isGroup(right)) {
      out.push(merge({ left, right }));

      const rest = words.slice(2);

      if (rest.length > 0) {
        out.push(rest);
      }
    } else {
      for (const element of words) {
        if (!isGroup(element)) {
          out.push(element);
        } else if (element.length === 1 && element[0]) {
          out.push(element[0]);
        } else {
          out.push(collapse({ matches: element, merge }));
        }
      }
    }

    words = out;
  }

  const result = out[0];

  if (result === undefined) {
    throw new Error("Collapsed to nothing.");
  }

  return result;
}

/**
 * Spell out a non-negative integer using a card-based language.
 */
export function cardsToWords({
  value,
  language,
}: {
  value: number;
  language: CardLanguage;
}): string {
  const matches = toCardMatches({ value, cards: language.cards });
  const collapsed = collapse({ matches, merge: language.merge });

  if (isGroup(collapsed)) {
    throw new Error("Collapsed to a group rather than a phrase.");
  }

  const postClean =
    language.postClean ??
    ((words: string) => {
      return words.replace(/\s+$/, "");
    });

  return postClean(collapsed.text);
}
