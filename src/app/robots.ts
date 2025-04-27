import { APP_URL } from "@/config";
import { type MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "./schema";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          // Allow about pages in all languages
          ...SUPPORTED_LANGUAGES.map((locale) => `/${locale}/about`),
          // Allow main app page (/en/app) for now
          "/en/app",
        ],
        disallow: [
          // Disallow root as it redirects to /en/app
          "/",
          // Disallow shared invoice URLs, like /en/app?data=*
          "/*app?data=*",
          "/*app?*data=*",
          // Disallow subscription confirmation pages with and without tokens
          "/confirm-subscription",
          "/confirm-subscription?*",
          ...SUPPORTED_LANGUAGES.flatMap((locale) => [
            `/${locale}/confirm-subscription`,
            `/${locale}/confirm-subscription?*`,
          ]),
          // Disallow any other query parameters
          "/*?*",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
