import dayjs from "dayjs";

import type { SupportedLanguages } from "@/app/schema";

// dayjs ships every locale as a side-effect module that registers itself on the
// dayjs singleton. `.locale("fr")` on an unregistered locale is a silent no-op
// (the date keeps the previous locale), so every language we support has to be
// imported here. This is the single place that does it for the invoice form.
import "dayjs/locale/de";
import "dayjs/locale/en";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/it";
import "dayjs/locale/nl";
import "dayjs/locale/pl";
import "dayjs/locale/pt";
import "dayjs/locale/ru";
import "dayjs/locale/uk";

interface FormatDateWithLocaleArgs {
  /** Any dayjs-parsable date (ISO string, Date, Dayjs, ...). */
  date: dayjs.ConfigType;
  /** A dayjs format token string, i.e. the invoice's `dateFormat`. */
  selectedDateFormat: string;
  /** The invoice PDF language the date should be rendered in. */
  language: SupportedLanguages;
}

/**
 * Format a date in the invoice PDF's language.
 *
 * Form helper texts must read the same way as the generated PDF, so they have to
 * use the invoice's `language` and not the ambient dayjs locale. The locale is
 * applied per instance (`dayjs().locale(...)`) rather than globally
 * (`dayjs.locale(...)`), so formatting one date never changes how the rest of the
 * app formats its own.
 *
 * @returns The formatted date string.
 */
export function formatDateWithLocale({
  date,
  selectedDateFormat,
  language,
}: FormatDateWithLocaleArgs): string {
  return dayjs(date).locale(language).format(selectedDateFormat);
}

/**
 * Format today's date in the invoice PDF's language.
 *
 * @returns Today, formatted.
 */
export function formatTodayWithLocale({
  selectedDateFormat,
  language,
}: Omit<FormatDateWithLocaleArgs, "date">): string {
  return formatDateWithLocale({ date: dayjs(), selectedDateFormat, language });
}
