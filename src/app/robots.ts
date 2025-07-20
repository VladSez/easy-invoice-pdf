import { APP_URL } from "@/config";
import { type MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "./schema";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          // Allow main app page (now at /)
          "/",
          // Allow about pages in all languages
          ...SUPPORTED_LANGUAGES.map((locale) => `/${locale}/about`),
        ],
        disallow: [
          // Disallow shared invoice URLs, like /?data=*
          "/?data=*",
          // Disallow subscription confirmation pages with and without tokens
          "/confirm-subscription",
          "/confirm-subscription?*",
          // Disallow favicon and other icon files from being indexed
          "/favicon.ico",
          "*.ico",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
