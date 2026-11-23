import { describe, expect, it } from "vitest";

import { hyphenateCellWord } from "../common/hyphenate-cell-word";

/** Stands in for react-pdf's built-in hyphenator with fixed syllables. */
function fakeHyphenate(word: string) {
  const syllables: Record<string, string[]> = {
    Purchase: ["Pur", "chase"],
  };

  return syllables[word] ?? [word];
}

describe("hyphenateCellWord", () => {
  it("keeps the built-in syllables of an ordinary word", () => {
    expect(hyphenateCellWord("Purchase", fakeHyphenate)).toEqual([
      "Pur",
      "chase",
    ]);
  });

  it("leaves a short word whole", () => {
    expect(hyphenateCellWord("line", fakeHyphenate)).toEqual(["line"]);
  });

  it("lets a long run with no syllables break anywhere", () => {
    expect(hyphenateCellWord("aaaaaaaaaa", fakeHyphenate)).toEqual(
      Array.from({ length: 10 }, () => {
        return "a";
      }),
    );
  });

  it("lets a code break anywhere, however short", () => {
    expect(hyphenateCellWord("A-12", fakeHyphenate)).toEqual([
      "A",
      "-",
      "1",
      "2",
    ]);
  });

  it("works without the built-in hyphenator, on the whole word", () => {
    expect(hyphenateCellWord("line")).toEqual(["line"]);
    expect(hyphenateCellWord("okie1233")).toHaveLength(8);
  });
});
