import { APP_URL } from "@/config";
import { type MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "./schema";
import { getChangelogEntries } from "./changelog/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const languages = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((lang) => [lang, `${APP_URL}/${lang}/about`]),
  );

  const changelogEntries = await getChangelogEntries();

  const sitemapEntries: MetadataRoute.Sitemap = [
    // Main app page (non-shared version)
    {
      url: `${APP_URL}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    // About pages in all languages
    ...SUPPORTED_LANGUAGES.map((locale) => ({
      url: `${APP_URL}/${locale}/about`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 1,
      // Add alternates for each about page for each language
      alternates: {
        languages: languages,
      },
    })),
    // Changelog page
    {
      url: `${APP_URL}/changelog`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    // Changelog entries
    ...changelogEntries.map((entry) => ({
      url: `${APP_URL}/changelog/${entry.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 1,
    })),
  ];

  return sitemapEntries;
}
