import type { Locale } from "next-intl";

export const OPEN_GRAPH_LOCALE_BY_LOCALE = {
  en: "en_US",
  pl: "pl_PL",
  de: "de_DE",
  es: "es_ES",
  pt: "pt_PT",
  ru: "ru_RU",
  uk: "uk_UA",
  fr: "fr_FR",
  it: "it_IT",
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
