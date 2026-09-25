import { describe, expect, it } from "vitest";

import {
  SUPPORTED_INVOICE_PDF_LANGUAGES,
  type SupportedLanguages,
} from "@/app/schema";

import { MAX_SPELLABLE, numberToWords } from "..";

/**
 * The output `n2words` produced for these values, captured before it was removed.
 *
 * This module replaced that package because it stored its number tables as BigInt
 * literals -- Safari 14+ syntax that no transpiler can lower, so the chunk it landed in
 * failed to parse outright on older iOS and took the invoice page down with it. Nothing
 * about the wording was meant to change, and these fixtures are what holds that line: they
 * are the old library's exact output, not a fresh reading of the grammar.
 *
 * The replacement was checked against `n2words` over every integer to 12,000, every scale
 * boundary, and 40,000 pseudo-random values across the whole supported range; it matched on
 * all ten languages. It was then checked against the fixtures `n2words` ships today, which
 * agreed everywhere except two points, both deliberate: Polish 90, where the old version
 * misspelled "dziewięćdziesiąt" and we follow the correction rather than the package (see
 * `../pl.ts`), and Dutch 1, which upstream now accents as "één" behind a new option whose
 * default it flipped -- a wording change, not a fix, so we keep "een".
 *
 * The rows below are the interesting corners of that sweep -- the irregular tens and
 * hundreds, the point where each scale word appears, and the plural forms the Slavic
 * languages switch between.
 */
const EXPECTED = {
  en: [
    [0, "zero"],
    [1, "one"],
    [11, "eleven"],
    [19, "nineteen"],
    [21, "twenty-one"],
    [42, "forty-two"],
    [80, "eighty"],
    [81, "eighty-one"],
    [99, "ninety-nine"],
    [100, "one hundred"],
    [101, "one hundred and one"],
    [111, "one hundred and eleven"],
    [200, "two hundred"],
    [700, "seven hundred"],
    [999, "nine hundred and ninety-nine"],
    [1000, "one thousand"],
    [1100, "one thousand one hundred"],
    [1234, "one thousand two hundred and thirty-four"],
    [2021, "two thousand and twenty-one"],
    [9999, "nine thousand nine hundred and ninety-nine"],
    [
      123_456,
      "one hundred and twenty-three thousand four hundred and fifty-six",
    ],
    [1_000_000, "one million"],
    [2_000_000, "two million"],
    [
      1_234_567,
      "one million two hundred and thirty-four thousand five hundred and sixty-seven",
    ],
    [1_000_000_000, "one billion"],
    [
      999_999_999_999,
      "nine hundred and ninety-nine billion nine hundred and ninety-nine million nine hundred and ninety-nine thousand nine hundred and ninety-nine",
    ],
  ],
  pl: [
    [0, "zero"],
    [1, "jeden"],
    [11, "jedenaście"],
    [19, "dziewiętnaście"],
    [21, "dwadzieścia jeden"],
    [42, "czterdzieści dwa"],
    [80, "osiemdziesiąt"],
    [81, "osiemdziesiąt jeden"],
    [99, "dziewięćdziesiąt dziewięć"],
    [100, "sto"],
    [101, "sto jeden"],
    [111, "sto jedenaście"],
    [200, "dwieście"],
    [700, "siedemset"],
    [999, "dziewięćset dziewięćdziesiąt dziewięć"],
    [1000, "tysiąc"],
    [1100, "tysiąc sto"],
    [1234, "tysiąc dwieście trzydzieści cztery"],
    [2021, "dwa tysiące dwadzieścia jeden"],
    [9999, "dziewięć tysięcy dziewięćset dziewięćdziesiąt dziewięć"],
    [123_456, "sto dwadzieścia trzy tysiące czterysta pięćdziesiąt sześć"],
    [1_000_000, "milion"],
    [2_000_000, "dwa miliony"],
    [
      1_234_567,
      "milion dwieście trzydzieści cztery tysiące pięćset sześćdziesiąt siedem",
    ],
    [1_000_000_000, "miliard"],
    [
      999_999_999_999,
      "dziewięćset dziewięćdziesiąt dziewięć miliardów dziewięćset dziewięćdziesiąt dziewięć milionów dziewięćset dziewięćdziesiąt dziewięć tysięcy dziewięćset dziewięćdziesiąt dziewięć",
    ],
  ],
  de: [
    [0, "null"],
    [1, "eins"],
    [11, "elf"],
    [19, "neunzehn"],
    [21, "einundzwanzig"],
    [42, "zweiundvierzig"],
    [80, "achtzig"],
    [81, "einundachtzig"],
    [99, "neunundneunzig"],
    [100, "einhundert"],
    [101, "einhunderteins"],
    [111, "einhundertelf"],
    [200, "zweihundert"],
    [700, "siebenhundert"],
    [999, "neunhundertneunundneunzig"],
    [1000, "eintausend"],
    [1100, "eintausendeinhundert"],
    [1234, "eintausendzweihundertvierunddreißig"],
    [2021, "zweitausendeinundzwanzig"],
    [9999, "neuntausendneunhundertneunundneunzig"],
    [123_456, "einhundertdreiundzwanzigtausendvierhundertsechsundfünfzig"],
    [1_000_000, "eine Million"],
    [2_000_000, "zwei Millionen"],
    [
      1_234_567,
      "eine Million zweihundertvierunddreißigtausendfünfhundertsiebenundsechzig",
    ],
    [1_000_000_000, "eine Milliarde"],
    [
      999_999_999_999,
      "neunhundertneunundneunzig Milliarden neunhundertneunundneunzig Millionen neunhundertneunundneunzigtausendneunhundertneunundneunzig",
    ],
  ],
  es: [
    [0, "cero"],
    [1, "uno"],
    [11, "once"],
    [19, "diecinueve"],
    [21, "veintiuno"],
    [42, "cuarenta y dos"],
    [80, "ochenta"],
    [81, "ochenta y uno"],
    [99, "noventa y nueve"],
    [100, "cien"],
    [101, "ciento uno"],
    [111, "ciento once"],
    [200, "doscientos"],
    [700, "setecientos"],
    [999, "novecientos noventa y nueve"],
    [1000, "mil"],
    [1100, "mil cien"],
    [1234, "mil doscientos treinta y cuatro"],
    [2021, "dos mil veintiuno"],
    [9999, "nueve mil novecientos noventa y nueve"],
    [123_456, "ciento veintitrés mil cuatrocientos cincuenta y seis"],
    [1_000_000, "un millón"],
    [2_000_000, "dos millones"],
    [
      1_234_567,
      "un millón doscientos treinta y cuatro mil quinientos sesenta y siete",
    ],
    [1_000_000_000, "mil millones"],
    [
      999_999_999_999,
      "novecientos noventa y nueve mil novecientos noventa y nueve millones novecientos noventa y nueve mil novecientos noventa y nueve",
    ],
  ],
  pt: [
    [0, "zero"],
    [1, "um"],
    [11, "onze"],
    [19, "dezanove"],
    [21, "vinte e um"],
    [42, "quarenta e dois"],
    [80, "oitenta"],
    [81, "oitenta e um"],
    [99, "noventa e nove"],
    [100, "cem"],
    [101, "cento e um"],
    [111, "cento e onze"],
    [200, "duzentos"],
    [700, "setecentos"],
    [999, "novecentos e noventa e nove"],
    [1000, "mil"],
    [1100, "mil e cem"],
    [1234, "mil duzentos e trinta e quatro"],
    [2021, "dois mil e vinte e um"],
    [9999, "nove mil novecentos e noventa e nove"],
    [123_456, "cento e vinte e três mil quatrocentos e cinquenta e seis"],
    [1_000_000, "um milhão"],
    [2_000_000, "dois milhões"],
    [
      1_234_567,
      "um milhão duzentos e trinta e quatro mil quinhentos e sessenta e sete",
    ],
    [1_000_000_000, "mil milhões"],
    [
      999_999_999_999,
      "novecentos e noventa e nove mil novecentos e noventa e nove milhões novecentos e noventa e nove mil novecentos e noventa e nove",
    ],
  ],
  // The rows `pt` and `pt-BR` disagree on are the point of this table: the teens
  // ("dezesseis", not "dezasseis") and every value from 10^9 up, where Brazil counts on
  // the short scale -- "um bilhão" against Portugal's "mil milhões".
  "pt-BR": [
    [0, "zero"],
    [1, "um"],
    [11, "onze"],
    [14, "quatorze"],
    [16, "dezesseis"],
    [17, "dezessete"],
    [19, "dezenove"],
    [21, "vinte e um"],
    [42, "quarenta e dois"],
    [80, "oitenta"],
    [81, "oitenta e um"],
    [99, "noventa e nove"],
    [100, "cem"],
    [101, "cento e um"],
    [111, "cento e onze"],
    [200, "duzentos"],
    [700, "setecentos"],
    [999, "novecentos e noventa e nove"],
    [1000, "mil"],
    [1100, "mil e cem"],
    [1234, "mil duzentos e trinta e quatro"],
    [2021, "dois mil e vinte e um"],
    [9999, "nove mil novecentos e noventa e nove"],
    [123_456, "cento e vinte e três mil quatrocentos e cinquenta e seis"],
    [1_000_000, "um milhão"],
    [2_000_000, "dois milhões"],
    [
      1_234_567,
      "um milhão duzentos e trinta e quatro mil quinhentos e sessenta e sete",
    ],
    [1_000_000_000, "um bilhão"],
    [2_000_000_000, "dois bilhões"],
    [
      999_999_999_999,
      "novecentos e noventa e nove bilhões novecentos e noventa e nove milhões novecentos e noventa e nove mil novecentos e noventa e nove",
    ],
  ],
  ru: [
    [0, "ноль"],
    [1, "один"],
    [11, "одиннадцать"],
    [19, "девятнадцать"],
    [21, "двадцать один"],
    [42, "сорок два"],
    [80, "восемьдесят"],
    [81, "восемьдесят один"],
    [99, "девяносто девять"],
    [100, "сто"],
    [101, "сто один"],
    [111, "сто одиннадцать"],
    [200, "двести"],
    [700, "семьсот"],
    [999, "девятьсот девяносто девять"],
    [1000, "одна тысяча"],
    [1100, "одна тысяча сто"],
    [1234, "одна тысяча двести тридцать четыре"],
    [2021, "две тысячи двадцать один"],
    [9999, "девять тысяч девятьсот девяносто девять"],
    [123_456, "сто двадцать три тысячи четыреста пятьдесят шесть"],
    [1_000_000, "один миллион"],
    [2_000_000, "два миллиона"],
    [
      1_234_567,
      "один миллион двести тридцать четыре тысячи пятьсот шестьдесят семь",
    ],
    [1_000_000_000, "один миллиард"],
    [
      999_999_999_999,
      "девятьсот девяносто девять миллиардов девятьсот девяносто девять миллионов девятьсот девяносто девять тысяч девятьсот девяносто девять",
    ],
  ],
  uk: [
    [0, "нуль"],
    [1, "один"],
    [11, "одинадцять"],
    [19, "дев'ятнадцять"],
    [21, "двадцять один"],
    [42, "сорок два"],
    [80, "вiсiмдесят"],
    [81, "вiсiмдесят один"],
    [99, "дев'яносто дев'ять"],
    [100, "сто"],
    [101, "сто один"],
    [111, "сто одинадцять"],
    [200, "двiстi"],
    [700, "сiмсот"],
    [999, "дев'ятсот дев'яносто дев'ять"],
    [1000, "одна тисяча"],
    [1100, "одна тисяча сто"],
    [1234, "одна тисяча двiстi тридцять чотири"],
    [2021, "двi тисячi двадцять один"],
    [9999, "дев'ять тисяч дев'ятсот дев'яносто дев'ять"],
    [123_456, "сто двадцять три тисячi чотириста п'ятдесят шiсть"],
    [1_000_000, "один мiльйон"],
    [2_000_000, "два мiльйони"],
    [
      1_234_567,
      "один мiльйон двiстi тридцять чотири тисячi п'ятсот шiстдесят сiм",
    ],
    [1_000_000_000, "один мiльярд"],
    [
      999_999_999_999,
      "дев'ятсот дев'яносто дев'ять мiльярдiв дев'ятсот дев'яносто дев'ять мiльйонiв дев'ятсот дев'яносто дев'ять тисяч дев'ятсот дев'яносто дев'ять",
    ],
  ],
  fr: [
    [0, "zéro"],
    [1, "un"],
    [11, "onze"],
    [19, "dix-neuf"],
    [21, "vingt et un"],
    [42, "quarante-deux"],
    [80, "quatre-vingts"],
    [81, "quatre-vingt-un"],
    [99, "quatre-vingt-dix-neuf"],
    [100, "cent"],
    [101, "cent un"],
    [111, "cent onze"],
    [200, "deux cents"],
    [700, "sept cents"],
    [999, "neuf cent quatre-vingt-dix-neuf"],
    [1000, "mille"],
    [1100, "mille cent"],
    [1234, "mille deux cent trente-quatre"],
    [2021, "deux mille vingt et un"],
    [9999, "neuf mille neuf cent quatre-vingt-dix-neuf"],
    [123_456, "cent vingt-trois mille quatre cent cinquante-six"],
    [1_000_000, "un million"],
    [2_000_000, "deux millions"],
    [
      1_234_567,
      "un million deux cent trente-quatre mille cinq cent soixante-sept",
    ],
    [1_000_000_000, "un milliard"],
    [
      999_999_999_999,
      "neuf cent quatre-vingt-dix-neuf milliards neuf cent quatre-vingt-dix-neuf millions neuf cent quatre-vingt-dix-neuf mille neuf cent quatre-vingt-dix-neuf",
    ],
  ],
  it: [
    [0, "zero"],
    [1, "uno"],
    [11, "undici"],
    [19, "diciannove"],
    [21, "ventuno"],
    [42, "quarantadue"],
    [80, "ottanta"],
    [81, "ottantuno"],
    [99, "novantanove"],
    [100, "cento"],
    [101, "centouno"],
    [111, "centoundici"],
    [200, "duecento"],
    [700, "settecento"],
    [999, "novecentonovantanove"],
    [1000, "mille"],
    [1100, "millecento"],
    [1234, "milleduecentotrentaquattro"],
    [2021, "duemilaventuno"],
    [9999, "novemilanovecentonovantanove"],
    [123_456, "centoventitremilaquattrocentocinquantasei"],
    [1_000_000, "un milione"],
    [2_000_000, "due milioni"],
    [
      1_234_567,
      "un milione e duecentotrentaquattromilacinquecentosessantasette",
    ],
    [1_000_000_000, "un miliardo"],
    [
      999_999_999_999,
      "novecentonovantanove miliardi, novecentonovantanove milioni e novecentonovantanovemilanovecentonovantanove",
    ],
  ],
  nl: [
    [0, "nul"],
    [1, "een"],
    [11, "elf"],
    [19, "negentien"],
    [21, "eenentwintig"],
    [42, "tweeënveertig"],
    [80, "tachtig"],
    [81, "eenentachtig"],
    [99, "negenennegentig"],
    [100, "honderd"],
    [101, "honderdeen"],
    [111, "honderdelf"],
    [200, "tweehonderd"],
    [700, "zevenhonderd"],
    [999, "negenhonderdnegenennegentig"],
    [1000, "duizend"],
    [1100, "elfhonderd"],
    [1234, "twaalfhonderd vierendertig"],
    [2021, "tweeduizend eenentwintig"],
    [9999, "negenennegentighonderd negenennegentig"],
    [123_456, "honderddrieëntwintigduizend vierhonderdzesenvijftig"],
    [1_000_000, "een miljoen"],
    [2_000_000, "twee miljoen"],
    [
      1_234_567,
      "een miljoen tweehonderdvierendertigduizend vijfhonderdzevenenzestig",
    ],
    [1_000_000_000, "een miljard"],
    [
      999_999_999_999,
      "negenhonderdnegenennegentig miljard negenhonderdnegenennegentig miljoen negenhonderdnegenennegentigduizend negenhonderdnegenennegentig",
    ],
  ],
  /**
   * Swedish is the one language here with no `n2words` counterpart to capture: the package
   * never shipped it. These rows are read from the grammar instead -- the compounds that
   * stay one word, the `ett`/`en` split before the scale nouns, and the tripled consonant
   * in `ettusen` -- so they are the specification rather than a recording of one.
   */
  sv: [
    [0, "noll"],
    [1, "ett"],
    [11, "elva"],
    [19, "nitton"],
    [21, "tjugoett"],
    [42, "fyrtiotvå"],
    [80, "åttio"],
    [81, "åttioett"],
    [99, "nittionio"],
    [100, "etthundra"],
    [101, "etthundraett"],
    [111, "etthundraelva"],
    [200, "tvåhundra"],
    [700, "sjuhundra"],
    [999, "niohundranittionio"],
    [1000, "ettusen"],
    [1100, "ettusenetthundra"],
    [1234, "ettusentvåhundratrettiofyra"],
    [2021, "tvåtusentjugoett"],
    [9999, "niotusenniohundranittionio"],
    [123_456, "etthundratjugotretusenfyrahundrafemtiosex"],
    [1_000_000, "en miljon"],
    [2_000_000, "två miljoner"],
    [1_234_567, "en miljon tvåhundratrettiofyratusenfemhundrasextiosju"],
    [1_000_000_000, "en miljard"],
    [
      999_999_999_999,
      "niohundranittionio miljarder niohundranittionio miljoner niohundranittioniotusenniohundranittionio",
    ],
  ],
  /**
   * Like Swedish, Norwegian has no `n2words` counterpart to capture, so these rows are read
   * from the grammar: tens and units joined into one word ("tjueen"), `og` before the last
   * group under a hundred, and the neuter `ett` before "hundre" and "tusen".
   */
  nb: [
    [0, "null"],
    [1, "en"],
    [11, "elleve"],
    [19, "nitten"],
    [21, "tjueen"],
    [42, "førtito"],
    [80, "åtti"],
    [81, "åttien"],
    [99, "nittini"],
    [100, "ett hundre"],
    [101, "ett hundre og en"],
    [111, "ett hundre og elleve"],
    [200, "to hundre"],
    [700, "sju hundre"],
    [999, "ni hundre og nittini"],
    [1000, "ett tusen"],
    [1001, "ett tusen og en"],
    [1234, "ett tusen to hundre og trettifire"],
    [2021, "to tusen og tjueen"],
    [9999, "ni tusen ni hundre og nittini"],
    [123_456, "ett hundre og tjuetre tusen fire hundre og femtiseks"],
    [1_000_000, "en million"],
    [2_000_000, "to millioner"],
    [
      1_234_567,
      "en million to hundre og trettifire tusen fem hundre og sekstisju",
    ],
    [1_000_000_000, "en milliard"],
    [
      999_999_999_999,
      "ni hundre og nittini milliarder ni hundre og nittini millioner ni hundre og nittini tusen ni hundre og nittini",
    ],
  ],
} satisfies Record<SupportedLanguages, readonly (readonly [number, string])[]>;

describe.each(SUPPORTED_INVOICE_PDF_LANGUAGES)(
  "numberToWords in %s",
  (language) => {
    it.each(EXPECTED[language])("spells out %i", (value, words) => {
      expect(numberToWords({ value, language })).toBe(words);
    });

    it("never returns an empty string", () => {
      for (let value = 0; value <= 2000; value++) {
        expect(numberToWords({ value, language })).not.toBe("");
      }
    });

    it("spells out every value up to the cap", () => {
      for (let value = 0; value <= 2000; value++) {
        expect(numberToWords({ value, language })).not.toBeNull();
      }
    });
  },
);

describe("numberToWords", () => {
  it("covers every supported language", () => {
    expect(Object.keys(EXPECTED).sort()).toEqual(
      [...SUPPORTED_INVOICE_PDF_LANGUAGES].sort(),
    );
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "throws on %p, which can only be a caller that skipped its validation",
    (value) => {
      expect(() => {
        return numberToWords({ value, language: "en" });
      }).toThrow("expected a whole, non-negative number");
    },
  );

  it.each([MAX_SPELLABLE + 1, Number.MAX_SAFE_INTEGER])(
    "returns null for %p rather than spelling out something wrong",
    (value) => {
      expect(numberToWords({ value, language: "en" })).toBeNull();
    },
  );

  it("spells Polish 90 the way Polish spells it", () => {
    // The package this replaced misspelled it as "dziewięćdzisiąt"; upstream has since
    // corrected it, and so do we. See `../pl.ts`.
    expect(numberToWords({ value: 90, language: "pl" })).toBe(
      "dziewięćdziesiąt",
    );
    expect(numberToWords({ value: 1_000_090, language: "pl" })).toContain(
      "dziewięćdziesiąt",
    );
  });

  it("still spells out the largest supported value", () => {
    expect(numberToWords({ value: MAX_SPELLABLE, language: "en" })).toBe(
      "nine hundred and ninety-nine billion nine hundred and ninety-nine million nine hundred and ninety-nine thousand nine hundred and ninety-nine",
    );
  });
});
