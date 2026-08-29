import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import type EnMessages from "../../messages/en.json";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  try {
    // Typically corresponds to the `[locale]` segment
    const requested = await requestLocale;

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
    console.error("Error generating metadata:", error);

    throw error;
  }
});
