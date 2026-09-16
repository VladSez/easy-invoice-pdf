import type { Locale } from "next-intl";

import { APP_URL } from "@/config";
import { routing } from "@/i18n/routing";

export const OPEN_GRAPH_LOCALE_BY_LOCALE = {
  en: "en_US",
  pl: "pl_PL",
  de: "de_DE",
  es: "es_ES",
  sv: "sv_SE",
  pt: "pt_PT",
  ru: "ru_RU",
  uk: "uk_UA",
  fr: "fr_FR",
  it: "it_IT",
  nb: "nb_NO",
  nl: "nl_NL",
} as const satisfies Record<Locale, string>;

/**
 * Convert locale to language code for schema.org ("en_US" -> "en-US").
 * @param locale - Locale string, e.g. 'en', 'pl'
 * @returns Schema.org formatted language code, e.g. 'en-US'
 */
export function toSchemaLanguage(locale: Locale) {
  return OPEN_GRAPH_LOCALE_BY_LOCALE[locale].replace("_", "-");
}

/**
 * Builds the `alternates.languages` (hreflang) map for a locale-prefixed route.
 *
 * Derived from {@link routing.locales} on purpose: an hreflang cluster has to
 * contain a *self-referencing* annotation, so a page that is missing from its
 * own set makes Google discard the whole group. A hand-written map silently
 * loses that self-reference for every language added after it was written —
 * which is exactly how `/sv/about` and `/nb/about` ended up without one.
 *
 * @param path - Path after the locale segment, no leading slash (e.g. `about`).
 */
export function buildHreflangAlternates(path: string) {
  const localizedUrls = Object.fromEntries(
    routing.locales.map((locale) => {
      return [locale, `${APP_URL}/${locale}/${path}`];
    }),
  ) as Record<Locale, string>;

  return {
    // `x-default` is an hreflang value rather than a locale, so it cannot be
    // part of the `Record<Locale, string>` above.
    "x-default": `${APP_URL}/${routing.defaultLocale}/${path}`,
    ...localizedUrls,
  };
}
