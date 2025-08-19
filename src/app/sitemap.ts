import { APP_URL } from "@/config";
import { type MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "./schema";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const languages = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((lang) => [lang, `${APP_URL}/${lang}/about`]),
  );

  const sitemapEntries: MetadataRoute.Sitemap = [
    // Main app page (non-shared version)
    {
      url: `${APP_URL}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    // About pages in all languages
    ...SUPPORTED_LANGUAGES.map((locale) => ({
      url: `${APP_URL}/${locale}/about`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 1,
      // Add alternates for each about page for each language
      alternates: {
        languages: languages,
      },
    })),
  ];

  return sitemapEntries;
}
