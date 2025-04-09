import { APP_URL } from "@/config";
import { type MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "./schema";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Allow only /about routes in all languages /en/about, /pl/about, etc. (we want to index them)
        allow: SUPPORTED_LANGUAGES.map((locale) => {
          return `/${locale}/about`;
        }),
        disallow: [
          "/app",
          "/confirm-subscription",
          // Disallow all app routes in all languages /en/app, /pl/app, etc. (we don't want to index them)
          ...SUPPORTED_LANGUAGES.map((locale) => `/${locale}/app`),
          ...SUPPORTED_LANGUAGES.map(
            (locale) => `/${locale}/confirm-subscription`
          ),
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
