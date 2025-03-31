import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import type EnMessages from "../../messages/en.json";

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = await import(`../../messages/${locale}.json`).then(
    (module: { default: typeof EnMessages }) => module.default
  );

  return {
    locale,
    messages,
  };
});
