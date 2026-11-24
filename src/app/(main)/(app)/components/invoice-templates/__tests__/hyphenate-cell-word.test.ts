import { describe, expect, it } from "vitest";

import { withBreaks } from "@/app/(main)/(app)/pdf-i18n-translations/with-breaks";

import { SOFT_HYPHEN, hyphenateCellWord } from "../common/hyphenate-cell-word";

/** Stands in for react-pdf's built-in hyphenator with fixed syllables. */
function fakeHyphenate(word: string) {
  const syllables: Record<string, string[]> = {
    Projektnummer: ["Pro", "jekt", "num", "mer"],
    Purchase: ["Pur", "chase"],
  };

  return syllables[word] ?? [word];
}

describe("hyphenateCellWord", () => {
  it("breaks a hinted word only at its hints, over react-pdf's syllables", () => {
    expect(
      hyphenateCellWord(withBreaks("Netto|preis"), () => {
        return ["Net", "to", "preis"];
      }),
    ).toEqual(["Netto", "preis"]);
  });

  it("still lets a long hinted part break anywhere, so a hint never overflows", () => {
    expect(
      hyphenateCellWord(`Bezeichnungs${SOFT_HYPHEN}art`).slice(0, 3),
    ).toEqual(["B", "e", "z"]);
  });

  it("keeps short syllables whole, so a word breaks between them", () => {
    expect(hyphenateCellWord("Projektnummer", fakeHyphenate)).toEqual([
      "Pro",
      "jekt",
      "num",
      "mer",
    ]);
  });

  it("lets a word with no syllables break anywhere once it is over three characters", () => {
    expect(hyphenateCellWord("Moms", fakeHyphenate)).toEqual([
      "M",
      "o",
      "m",
      "s",
    ]);
  });

  it("lets a long syllable break between any two characters", () => {
    expect(hyphenateCellWord("Purchase", fakeHyphenate)).toEqual([
      "Pur",
      "c",
      "h",
      "a",
      "s",
      "e",
    ]);
  });

  it("never breaks a word of three characters or fewer", () => {
    expect(hyphenateCellWord("of")).toEqual(["of"]);
    expect(hyphenateCellWord("VAT")).toEqual(["VAT"]);
  });

  it("lets a longer word break between any two characters", () => {
    expect(hyphenateCellWord("MwSt.")).toEqual(["M", "w", "S", "t", "."]);
    expect(hyphenateCellWord("aaaaaaaaaa")).toHaveLength(10);
  });

  it("lets a code break anywhere", () => {
    expect(hyphenateCellWord("SKU-881")).toEqual([
      "S",
      "K",
      "U",
      "-",
      "8",
      "8",
      "1",
    ]);
  });

  it("puts the word back together unchanged", () => {
    expect(hyphenateCellWord("Швидкопричепляючийся").join("")).toBe(
      "Швидкопричепляючийся",
    );
  });
});
