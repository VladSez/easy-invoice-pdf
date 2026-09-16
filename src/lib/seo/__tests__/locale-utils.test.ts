import { describe, expect, it } from "vitest";

import { SUPPORTED_LANGUAGES } from "@/app/schema";
import { APP_URL } from "@/config";
import {
  buildHreflangAlternates,
  OPEN_GRAPH_LOCALE_BY_LOCALE,
} from "@/lib/seo/locale-utils";

describe("buildHreflangAlternates", () => {
  it("annotates every supported language plus x-default", () => {
    const alternates = buildHreflangAlternates("about");

    expect(Object.keys(alternates).toSorted()).toEqual(
      ["x-default", ...SUPPORTED_LANGUAGES].toSorted(),
    );
    expect(alternates["x-default"]).toBe(`${APP_URL}/en/about`);
  });

  it.each(SUPPORTED_LANGUAGES)(
    "gives /%s/about a self-referencing annotation",
    (locale) => {
      // Google discards an hreflang cluster whose pages are not listed in it,
      // so each localized page has to point at itself as well as its siblings.
      expect(buildHreflangAlternates("about")[locale]).toBe(
        `${APP_URL}/${locale}/about`,
      );
    },
  );

  it("covers every supported language with an Open Graph locale", () => {
    expect(Object.keys(OPEN_GRAPH_LOCALE_BY_LOCALE).toSorted()).toEqual(
      [...SUPPORTED_LANGUAGES].toSorted(),
    );
  });
});
