import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";

import type EnMessages from "../../messages/en.json";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale: explicitLocale }) => {
  try {
    // An explicit override (`getTranslations({ locale })`) wins. Otherwise the locale
    // is the `[locale]` root param. It is `undefined` under the `(main)` root layout
    // (`/`, `/changelog`, ...) and can be anything at all for a URL like `/xx/about`,
    // so both fall back to the default locale; the localized layouts decide whether
    // an unknown value is a 404.
    const requested = explicitLocale ?? (await rootLocale());

    const locale = hasLocale(routing.locales, requested)
      ? requested
      : routing.defaultLocale;

    const messages = await import(`../../messages/${locale}.json`).then(
      (module: { default: typeof EnMessages }) => {
        return module.default;
      },
    );

    return {
      locale,
      messages,
    };
  } catch (error) {
    console.error(
      "[i18n] [request.ts] Error resolving the request locale:",
      error,
    );

    throw error;
  }
});
