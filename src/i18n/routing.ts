import { defineRouting } from "next-intl/routing";
import { SUPPORTED_LANGUAGES } from "@/app/schema";

const defaultLocaleEN = SUPPORTED_LANGUAGES[0];

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: SUPPORTED_LANGUAGES,

  // Used when no locale matches
  defaultLocale: defaultLocaleEN,

  // Add locales to the matcher to support specific patterns
  // Configure which paths are not localized
  // For the about page, we'll use locale prefixes (handled by pathnames in routing)
  localePrefix: "always",

  // Define pathnames for our routes
  // pathnames: {
  //   // "/app": {
  //   //   en: "/app",
  //   //   pl: "/app",
  //   // },
  // },
});
